"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import { getOrgPlan, requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const emailSchema = z.string().email();
const roleSchema = z.enum(["admin", "member"]);
const tokenSchema = z.string().min(16);
const userIdSchema = z.string().uuid();

type MemberRow = {
  user_id: string;
  role: Role;
  joined_at: string;
  invited_by: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  role: "admin" | "member";
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

async function getMemberCount(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (error) {
    console.error("[invites:memberCount]", error.message);
    return 0;
  }

  return count ?? 0;
}

async function sendInviteEmail(input: {
  to: string;
  orgName: string;
  token: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const inviteUrl = `${origin}/invite/${input.token}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `Join ${input.orgName} on S1mpleCRM`,
      html: `<p>You have been invited to join <strong>${input.orgName}</strong>.</p><p><a href="${inviteUrl}">Accept invite</a></p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[invites:sendEmail]", response.status, body);
  }
}

export async function createInvite(
  email: string,
  role: "admin" | "member",
): Promise<ActionResult<InviteRow>> {
  const parsedEmail = emailSchema.safeParse(email);
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedEmail.success) {
    return { data: null, error: "Invalid email" };
  }
  if (!parsedRole.success) {
    return { data: null, error: "Invalid role" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "members:invite")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const { limits } = await getOrgPlan(org.id);
  const memberCount = await getMemberCount(org.id);
  if (memberCount >= limits.members) {
    return { data: null, error: "Member limit reached for your plan" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("invites")
    .insert({
      org_id: org.id,
      email: parsedEmail.data.toLowerCase(),
      role: parsedRole.data,
    })
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .single();

  if (error || !data) {
    console.error("[invites:createInvite]", error?.message);
    return { data: null, error: "Could not create invite" };
  }

  await sendInviteEmail({
    to: data.email,
    orgName: org.name,
    token: data.token,
  });

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "invited",
    entityType: "invite",
    entityId: data.id,
    meta: { email: data.email, role: data.role },
  });

  return { data: data as InviteRow, error: null };
}

export async function acceptInvite(
  token: string,
): Promise<ActionResult<{ orgId: string }>> {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) {
    return { data: null, error: "Invalid invite token" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail) {
    return { data: null, error: "Your account has no email" };
  }

  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", parsed.data)
    .maybeSingle();

  if (inviteError) {
    console.error("[invites:acceptInvite]", inviteError.message);
    return { data: null, error: "Could not load invite" };
  }

  if (!invite) {
    return { data: null, error: "Invite not found" };
  }

  if (invite.accepted_at) {
    return { data: null, error: "Invite already accepted" };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { data: null, error: "Invite has expired" };
  }

  if (invite.email.toLowerCase() !== userEmail) {
    return { data: null, error: "This invite was sent to a different email" };
  }

  const { data: existing } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", invite.org_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        org_id: invite.org_id,
        user_id: user.id,
        role: invite.role,
      });

    if (memberError) {
      console.error("[invites:acceptInvite:member]", memberError.message);
      return { data: null, error: "Could not join organization" };
    }
  }

  const { error: updateError } = await supabase
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    console.error("[invites:acceptInvite:update]", updateError.message);
    return { data: null, error: "Could not mark invite as accepted" };
  }

  await writeActivity({
    orgId: invite.org_id,
    actorId: user.id,
    verb: "joined",
    entityType: "organization",
    entityId: invite.org_id,
    meta: { via: "invite" },
  });

  return { data: { orgId: invite.org_id }, error: null };
}

export async function listMembers(): Promise<ActionResult<MemberRow[]>> {
  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, joined_at, invited_by")
    .eq("org_id", org.id)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[invites:listMembers]", error.message);
    return { data: null, error: "Could not load members" };
  }

  return { data: (data ?? []) as MemberRow[], error: null };
}

export async function updateMemberRole(
  userId: string,
  role: "admin" | "member",
): Promise<ActionResult<MemberRow>> {
  const parsedUserId = userIdSchema.safeParse(userId);
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedUserId.success) {
    return { data: null, error: "Invalid user" };
  }
  if (!parsedRole.success) {
    return { data: null, error: "Invalid role" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "members:manage")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: target, error: targetError } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("org_id", org.id)
    .eq("user_id", parsedUserId.data)
    .maybeSingle();

  if (targetError || !target) {
    return { data: null, error: "Member not found" };
  }

  if (target.role === "owner") {
    return { data: null, error: "Cannot change the owner role" };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .update({ role: parsedRole.data })
    .eq("org_id", org.id)
    .eq("user_id", parsedUserId.data)
    .select("user_id, role, joined_at, invited_by")
    .single();

  if (error || !data) {
    console.error("[invites:updateMemberRole]", error?.message);
    return { data: null, error: "Could not update member role" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "role_changed",
    entityType: "member",
    entityId: parsedUserId.data,
    meta: { role: parsedRole.data },
  });

  return { data: data as MemberRow, error: null };
}

export async function removeMember(
  userId: string,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) {
    return { data: null, error: "Invalid user" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const isSelf = parsed.data === user.id;

  if (!isSelf && !can(org.role, "members:manage")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const { data: target, error: targetError } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("org_id", org.id)
    .eq("user_id", parsed.data)
    .maybeSingle();

  if (targetError || !target) {
    return { data: null, error: "Member not found" };
  }

  if (target.role === "owner") {
    return { data: null, error: "Cannot remove the organization owner" };
  }

  if (!isSelf && org.role !== "owner") {
    return { data: null, error: "Only the owner can remove other members" };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("org_id", org.id)
    .eq("user_id", parsed.data);

  if (error) {
    console.error("[invites:removeMember]", error.message);
    return { data: null, error: "Could not remove member" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user.id,
    verb: isSelf ? "left" : "removed",
    entityType: "member",
    entityId: parsed.data,
  });

  return { data: { userId: parsed.data }, error: null };
}
