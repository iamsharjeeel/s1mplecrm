"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import {
  requireActiveOrg,
  setActiveOrgCookie,
  slugify,
} from "@/lib/org";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const nameSchema = z.string().min(1, "Name is required").max(100);
const orgIdSchema = z.string().uuid("Invalid organization");

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: Role;
};

export async function createOrganization(
  name: string,
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const slug = slugify(parsed.data);
  const orgId = crypto.randomUUID();

  const { error: orgError } = await supabase.from("organizations").insert({
    id: orgId,
    name: parsed.data,
    slug,
  });

  if (orgError) {
    console.error("[orgs:createOrganization]", orgError.message);
    return { data: null, error: `Could not create organization: ${orgError.message}` };
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ org_id: orgId, user_id: user.id, role: "owner" });

  if (memberError) {
    console.error("[orgs:createOrganization:member]", memberError.message);
    return { data: null, error: `Could not add you as owner: ${memberError.message}` };
  }

  await setActiveOrgCookie(orgId);

  await writeActivity({
    orgId,
    actorId: user.id,
    verb: "created",
    entityType: "organization",
    entityId: orgId,
    meta: { name: parsed.data },
  });

  return {
    data: { id: orgId, name: parsed.data, slug },
    error: null,
  };
}

export async function updateOrganization(
  name: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "org:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("organizations")
    .update({ name: parsed.data })
    .eq("id", org.id)
    .select("id, name")
    .single();

  if (error || !data) {
    console.error("[orgs:updateOrganization]", error?.message);
    return { data: null, error: "Could not update organization" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "updated",
    entityType: "organization",
    entityId: org.id,
    meta: { name: data.name },
  });

  return { data, error: null };
}

export async function switchOrganization(
  orgId: string,
): Promise<ActionResult<{ orgId: string }>> {
  const parsed = orgIdSchema.safeParse(orgId);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid organization" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("org_id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[orgs:switchOrganization]", error.message);
    return { data: null, error: "Could not verify membership" };
  }

  if (!membership) {
    return { data: null, error: "You are not a member of this organization" };
  }

  await setActiveOrgCookie(parsed.data);

  return { data: { orgId: parsed.data }, error: null };
}

export async function listMyOrganizations(): Promise<
  ActionResult<OrganizationSummary[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug, logo_url)")
    .eq("user_id", user.id);

  if (error) {
    console.error("[orgs:listMyOrganizations]", error.message);
    return { data: null, error: "Could not load organizations" };
  }

  type Row = {
    role: Role;
    organizations:
      | { id: string; name: string; slug: string; logo_url: string | null }
      | { id: string; name: string; slug: string; logo_url: string | null }[]
      | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  const orgs: OrganizationSummary[] = [];

  for (const row of rows) {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    if (!org) continue;
    orgs.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url,
      role: row.role,
    });
  }

  return { data: orgs, error: null };
}
