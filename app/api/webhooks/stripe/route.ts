import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PLACEHOLDER_SECRETS = new Set(["whsec_placeholder", ""]);

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const parts = signatureHeader.split(",");
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const signed = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed, "utf8")
    .digest("hex");

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig, "hex"),
        Buffer.from(expected, "hex"),
      );
    } catch {
      return false;
    }
  });
}

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
    console.error("[webhooks:stripe:insert]", error.message);
    return "error";
  }
  return "new";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const signature = request.headers.get("stripe-signature");

  if (!PLACEHOLDER_SECRETS.has(secret)) {
    if (!signature || !verifyStripeSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const externalId =
    typeof event.id === "string" ? event.id : crypto.randomUUID();

  const recorded = await recordWebhookEvent("stripe", externalId, event);
  if (recorded === "duplicate") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (recorded === "error") {
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  const eventType = typeof event.type === "string" ? event.type : "unknown";

  switch (eventType) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
    case "invoice.payment_failed":
      break;
    default:
      break;
  }

  const admin = createAdminClient();
  await admin
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("source", "stripe")
    .eq("external_id", externalId);

  return NextResponse.json({ ok: true, type: eventType });
}
