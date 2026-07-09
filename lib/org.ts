import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/permissions";
import { PLAN_LIMITS, type PlanId, type PlanLimits } from "@/lib/plans";

export const ACTIVE_ORG_COOKIE = "s1mple_active_org";

export type ActiveOrg = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: Role;
};

export async function getActiveOrg(): Promise<ActiveOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("role, org_id, organizations(id, name, slug, logo_url)")
    .eq("user_id", user.id);

  if (error) {
    console.error("[org:getActiveOrg]", error.message);
    return null;
  }

  if (!memberships?.length) return null;

  type MembershipRow = {
    role: Role;
    org_id: string;
    organizations:
      | { id: string; name: string; slug: string; logo_url: string | null }
      | { id: string; name: string; slug: string; logo_url: string | null }[]
      | null;
  };

  const rows = memberships as unknown as MembershipRow[];

  const pick = rows.find((m) => m.org_id === cookieOrgId) ?? rows[0];
  const org = Array.isArray(pick.organizations)
    ? pick.organizations[0]
    : pick.organizations;

  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo_url: org.logo_url,
    role: pick.role,
  };
}

export async function requireActiveOrg(): Promise<ActiveOrg> {
  const org = await getActiveOrg();
  if (!org) {
    throw new Error("No active organization");
  }
  return org;
}

export async function setActiveOrgCookie(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getOrgPlan(orgId: string): Promise<{
  plan: PlanId;
  limits: PlanLimits;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("org_id", orgId)
    .maybeSingle();

  const plan =
    data?.plan && data.plan in PLAN_LIMITS && data.status === "active"
      ? (data.plan as PlanId)
      : "free";

  return { plan, limits: PLAN_LIMITS[plan] };
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "org"}-${suffix}`;
}
