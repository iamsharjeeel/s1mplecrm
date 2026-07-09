import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    [key: string]: unknown;
  };
};

const STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "delayed",
};

async function recordWebhookEvent(
  source: string,
  externalId: string,
  payload: Record<string, unknown>,
): Promise<"new" | "duplicate" | "error"> {
  const admin = createAdminClient();
  const { error } = await admin.from("webhook_events").insert({
    source,
    external_id: externalId,
    payload,
  });

  if (error?.code === "23505") return "duplicate";
  if (error) {
    console.error("[webhooks:resend:insert]", error.message);
    return "error";
  }
  return "new";
}

export async function POST(request: Request) {
  let payload: ResendWebhookPayload;
  try {
    payload = (await request.json()) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const svixId = request.headers.get("svix-id");
  const externalId =
    svixId ??
    `${payload.type ?? "event"}:${payload.data?.email_id ?? ""}:${payload.created_at ?? Date.now()}`;

  const recorded = await recordWebhookEvent(
    "resend",
    externalId,
    payload as Record<string, unknown>,
  );
  if (recorded === "duplicate") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (recorded === "error") {
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  const eventType = payload.type ?? "";
  const providerId = payload.data?.email_id;
  const status = STATUS_MAP[eventType];

  if (providerId && status) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("emails")
      .update({ status })
      .eq("provider_id", providerId);

    if (error) {
      console.error("[webhooks:resend:updateEmail]", error.message);
    }
  }

  const admin = createAdminClient();
  await admin
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("source", "resend")
    .eq("external_id", externalId);

  return NextResponse.json({ ok: true, type: eventType });
}
