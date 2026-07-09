"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import { requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const contactIdSchema = z.string().uuid();
const sendEmailSchema = z.object({
  contactId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
});

type EmailRow = {
  id: string;
  org_id: string;
  contact_id: string | null;
  direction: "outbound" | "inbound";
  subject: string;
  body_html: string;
  status: string;
  provider_id: string | null;
  sent_by: string | null;
  created_at: string;
};

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ providerId: string | null; status: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return { providerId: null, status: "skipped" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[emails:sendViaResend]", response.status, body);
    return { providerId: null, status: "failed" };
  }

  const payload = (await response.json()) as { id?: string };
  return { providerId: payload.id ?? null, status: "sent" };
}

export async function sendContactEmail(
  contactId: string,
  subject: string,
  bodyHtml: string,
): Promise<ActionResult<EmailRow>> {
  const parsed = sendEmailSchema.safeParse({ contactId, subject, bodyHtml });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "emails:send")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name")
    .eq("id", parsed.data.contactId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (contactError || !contact) {
    return { data: null, error: "Contact not found" };
  }

  if (!contact.email) {
    return { data: null, error: "Contact has no email address" };
  }

  const sendResult = await sendViaResend({
    to: contact.email,
    subject: parsed.data.subject,
    html: parsed.data.bodyHtml,
  });

  const { data, error } = await supabase
    .from("emails")
    .insert({
      org_id: org.id,
      contact_id: contact.id,
      direction: "outbound",
      subject: parsed.data.subject,
      body_html: parsed.data.bodyHtml,
      status: sendResult.status,
      provider_id: sendResult.providerId,
      sent_by: user?.id ?? null,
    })
    .select(
      "id, org_id, contact_id, direction, subject, body_html, status, provider_id, sent_by, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[emails:sendContactEmail]", error?.message);
    return { data: null, error: "Could not save email record" };
  }

  if (sendResult.status === "failed") {
    return { data: data as EmailRow, error: "Email could not be sent" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "sent",
    entityType: "email",
    entityId: data.id,
    meta: {
      contact_id: contact.id,
      subject: parsed.data.subject,
      to: contact.email,
    },
  });

  return { data: data as EmailRow, error: null };
}

export async function listContactEmails(
  contactId: string,
): Promise<ActionResult<EmailRow[]>> {
  const parsed = contactIdSchema.safeParse(contactId);
  if (!parsed.success) {
    return { data: null, error: "Invalid contact" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", parsed.data)
    .eq("org_id", org.id)
    .maybeSingle();

  if (contactError || !contact) {
    return { data: null, error: "Contact not found" };
  }

  const { data, error } = await supabase
    .from("emails")
    .select(
      "id, org_id, contact_id, direction, subject, body_html, status, provider_id, sent_by, created_at",
    )
    .eq("org_id", org.id)
    .eq("contact_id", parsed.data)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[emails:listContactEmails]", error.message);
    return { data: null, error: "Could not load emails" };
  }

  return { data: (data ?? []) as EmailRow[], error: null };
}
