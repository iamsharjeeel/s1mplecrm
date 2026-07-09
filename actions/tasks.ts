"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import { requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const idSchema = z.string().uuid();

const taskInputSchema = z.object({
  title: z.string().min(1).max(200),
  due_at: z.string().datetime().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  related_contact_id: z.string().uuid().optional().nullable(),
  related_deal_id: z.string().uuid().optional().nullable(),
});

const listTasksSchema = z.object({
  mine: z.boolean().optional(),
});

type TaskRow = {
  id: string;
  org_id: string;
  title: string;
  due_at: string | null;
  assignee_id: string | null;
  related_contact_id: string | null;
  related_deal_id: string | null;
  completed_at: string | null;
  created_at: string;
};

export async function listTasks(
  filters: { mine?: boolean } = {},
): Promise<ActionResult<TaskRow[]>> {
  const parsed = listTasksSchema.safeParse(filters);
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
    .from("tasks")
    .select(
      "id, org_id, title, due_at, assignee_id, related_contact_id, related_deal_id, completed_at, created_at",
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (parsed.data.mine) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }
    query = query.eq("assignee_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[tasks:listTasks]", error.message);
    return { data: null, error: "Could not load tasks" };
  }

  return { data: (data ?? []) as TaskRow[], error: null };
}

export async function createTask(
  input: z.input<typeof taskInputSchema>,
): Promise<ActionResult<TaskRow>> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "tasks:manage")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: org.id,
      title: parsed.data.title,
      due_at: parsed.data.due_at ?? null,
      assignee_id: parsed.data.assignee_id ?? user?.id ?? null,
      related_contact_id: parsed.data.related_contact_id ?? null,
      related_deal_id: parsed.data.related_deal_id ?? null,
    })
    .select(
      "id, org_id, title, due_at, assignee_id, related_contact_id, related_deal_id, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[tasks:createTask]", error?.message);
    return { data: null, error: "Could not create task" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "created",
    entityType: "task",
    entityId: data.id,
    meta: { title: data.title },
  });

  return { data: data as TaskRow, error: null };
}

export async function toggleTaskComplete(
  taskId: string,
): Promise<ActionResult<TaskRow>> {
  const parsed = idSchema.safeParse(taskId);
  if (!parsed.success) {
    return { data: null, error: "Invalid task" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "tasks:manage")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("id, completed_at")
    .eq("id", parsed.data)
    .eq("org_id", org.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { data: null, error: "Task not found" };
  }

  const completed_at = existing.completed_at
    ? null
    : new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at })
    .eq("id", parsed.data)
    .eq("org_id", org.id)
    .select(
      "id, org_id, title, due_at, assignee_id, related_contact_id, related_deal_id, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[tasks:toggleTaskComplete]", error?.message);
    return { data: null, error: "Could not update task" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: completed_at ? "completed" : "reopened",
    entityType: "task",
    entityId: data.id,
    meta: { title: data.title },
  });

  return { data: data as TaskRow, error: null };
}

export async function deleteTask(
  taskId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = idSchema.safeParse(taskId);
  if (!parsed.success) {
    return { data: null, error: "Invalid task" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "tasks:manage")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data)
    .eq("org_id", org.id);

  if (error) {
    console.error("[tasks:deleteTask]", error.message);
    return { data: null, error: "Could not delete task" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "deleted",
    entityType: "task",
    entityId: parsed.data,
  });

  return { data: { id: parsed.data }, error: null };
}
