"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import { getOrgPlan, requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const contactInputSchema = z.object({
  first_name: z.string().max(100).default(""),
  last_name: z.string().max(100).default(""),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
});

const listContactsSchema = z.object({
  q: z.string().max(200).optional(),
  tag: z.string().max(50).optional(),
});

const idSchema = z.string().uuid("Invalid contact");

type ContactRow = {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  owner_id: string | null;
  created_at: string;
};

async function getContactCount(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (error) {
    console.error("[contacts:count]", error.message);
    return 0;
  }

  return count ?? 0;
}

function parseCsvRows(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function parseTagsCell(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(/[;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function listContacts(
  filters: { q?: string; tag?: string } = {},
): Promise<ActionResult<ContactRow[]>> {
  const parsed = listContactsSchema.safeParse(filters);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid filters" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select(
      "id, org_id, first_name, last_name, email, phone, company, tags, owner_id, created_at",
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (parsed.data.tag) {
    query = query.contains("tags", [parsed.data.tag]);
  }

  if (parsed.data.q) {
    const q = `%${parsed.data.q}%`;
    query = query.or(
      `first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q},company.ilike.${q}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[contacts:listContacts]", error.message);
    return { data: null, error: "Could not load contacts" };
  }

  return { data: (data ?? []) as ContactRow[], error: null };
}

export async function getContact(id: string): Promise<ActionResult<ContactRow>> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid contact" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, org_id, first_name, last_name, email, phone, company, tags, owner_id, created_at",
    )
    .eq("id", parsed.data)
    .eq("org_id", org.id)
    .maybeSingle();

  if (error) {
    console.error("[contacts:getContact]", error.message);
    return { data: null, error: "Could not load contact" };
  }

  if (!data) {
    return { data: null, error: "Contact not found" };
  }

  return { data: data as ContactRow, error: null };
}

export async function createContact(
  input: z.input<typeof contactInputSchema>,
): Promise<ActionResult<ContactRow>> {
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "contacts:create")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const { limits } = await getOrgPlan(org.id);
  const count = await getContactCount(org.id);
  if (count >= limits.contacts) {
    return { data: null, error: "Contact limit reached for your plan" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      org_id: org.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      tags: parsed.data.tags,
      owner_id: user?.id ?? null,
    })
    .select(
      "id, org_id, first_name, last_name, email, phone, company, tags, owner_id, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[contacts:createContact]", error?.message);
    return { data: null, error: "Could not create contact" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "created",
    entityType: "contact",
    entityId: data.id,
    meta: { name: `${data.first_name} ${data.last_name}`.trim() },
  });

  return { data: data as ContactRow, error: null };
}

export async function updateContact(
  id: string,
  input: z.input<typeof contactInputSchema>,
): Promise<ActionResult<ContactRow>> {
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    return { data: null, error: idParsed.error.issues[0]?.message ?? "Invalid contact" };
  }

  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "contacts:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contacts")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      tags: parsed.data.tags,
    })
    .eq("id", idParsed.data)
    .eq("org_id", org.id)
    .select(
      "id, org_id, first_name, last_name, email, phone, company, tags, owner_id, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[contacts:updateContact]", error?.message);
    return { data: null, error: "Could not update contact" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "updated",
    entityType: "contact",
    entityId: data.id,
    meta: { name: `${data.first_name} ${data.last_name}`.trim() },
  });

  return { data: data as ContactRow, error: null };
}

export async function deleteContact(id: string): Promise<ActionResult<{ id: string }>> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid contact" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "contacts:delete")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", parsed.data)
    .eq("org_id", org.id);

  if (error) {
    console.error("[contacts:deleteContact]", error.message);
    return { data: null, error: "Could not delete contact" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "deleted",
    entityType: "contact",
    entityId: parsed.data,
  });

  return { data: { id: parsed.data }, error: null };
}

export async function importContactsCsv(
  csvText: string,
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  if (!csvText.trim()) {
    return { data: null, error: "CSV is empty" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "contacts:create")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const rows = parseCsvRows(csvText);
  if (!rows.length) {
    return { data: null, error: "No data rows found in CSV" };
  }

  const { limits } = await getOrgPlan(org.id);
  const existing = await getContactCount(org.id);
  const remaining = Math.max(0, limits.contacts - existing);

  if (remaining === 0) {
    return { data: null, error: "Contact limit reached for your plan" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const toImport = rows.slice(0, remaining).map((row) => ({
    org_id: org.id,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    email: row.email?.trim() || null,
    phone: row.phone?.trim() || null,
    company: row.company?.trim() || null,
    tags: parseTagsCell(row.tags ?? ""),
    owner_id: user?.id ?? null,
  }));

  const { data, error } = await supabase
    .from("contacts")
    .insert(toImport)
    .select("id");

  if (error) {
    console.error("[contacts:importContactsCsv]", error.message);
    return { data: null, error: "Could not import contacts" };
  }

  const imported = data?.length ?? 0;
  const skipped = rows.length - imported;

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "imported",
    entityType: "contact",
    meta: { imported, skipped },
  });

  return { data: { imported, skipped }, error: null };
}
