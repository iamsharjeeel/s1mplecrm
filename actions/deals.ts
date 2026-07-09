"use server";

import { z } from "zod";
import { writeActivity } from "@/lib/activity";
import { requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const idSchema = z.string().uuid();

const dealInputSchema = z.object({
  title: z.string().min(1).max(200),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  contact_id: z.string().uuid().optional().nullable(),
  value: z.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default("USD"),
  owner_id: z.string().uuid().optional().nullable(),
});

const dealUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  contact_id: z.string().uuid().optional().nullable(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  owner_id: z.string().uuid().optional().nullable(),
  stage_id: z.string().uuid().optional(),
});

type DealRow = {
  id: string;
  org_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  title: string;
  value: number;
  currency: string;
  status: "open" | "won" | "lost";
  owner_id: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type StageWithDeals = {
  id: string;
  name: string;
  position: number;
  color: string;
  deals: DealRow[];
};

export type PipelineBoard = {
  pipeline: { id: string; name: string };
  stages: StageWithDeals[];
};

export async function listPipelineBoard(
  pipelineId?: string,
): Promise<ActionResult<PipelineBoard>> {
  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  const supabase = await createClient();

  let pipeline: { id: string; name: string } | null = null;
  let pipelineError: { message: string } | null = null;

  if (pipelineId) {
    const parsed = idSchema.safeParse(pipelineId);
    if (!parsed.success) {
      return { data: null, error: "Invalid pipeline" };
    }

    const result = await supabase
      .from("pipelines")
      .select("id, name")
      .eq("org_id", org.id)
      .eq("id", parsed.data)
      .maybeSingle();

    pipeline = result.data;
    pipelineError = result.error;
  } else {
    const result = await supabase
      .from("pipelines")
      .select("id, name")
      .eq("org_id", org.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    pipeline = result.data;
    pipelineError = result.error;
  }

  if (pipelineError) {
    console.error("[deals:listPipelineBoard:pipeline]", pipelineError.message);
    return { data: null, error: "Could not load pipeline" };
  }

  if (!pipeline) {
    return { data: null, error: "Pipeline not found" };
  }

  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select("id, name, position, color")
    .eq("org_id", org.id)
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true });

  if (stagesError) {
    console.error("[deals:listPipelineBoard:stages]", stagesError.message);
    return { data: null, error: "Could not load stages" };
  }

  const { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select(
      "id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status, owner_id, closed_at, created_at, updated_at",
    )
    .eq("org_id", org.id)
    .eq("pipeline_id", pipeline.id)
    .order("updated_at", { ascending: false });

  if (dealsError) {
    console.error("[deals:listPipelineBoard:deals]", dealsError.message);
    return { data: null, error: "Could not load deals" };
  }

  const dealsByStage = new Map<string, DealRow[]>();
  for (const deal of (deals ?? []) as DealRow[]) {
    const list = dealsByStage.get(deal.stage_id) ?? [];
    list.push(deal);
    dealsByStage.set(deal.stage_id, list);
  }

  const board: PipelineBoard = {
    pipeline: { id: pipeline.id, name: pipeline.name },
    stages: (stages ?? []).map((stage) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
      color: stage.color,
      deals: dealsByStage.get(stage.id) ?? [],
    })),
  };

  return { data: board, error: null };
}

export async function createDeal(
  input: z.input<typeof dealInputSchema>,
): Promise<ActionResult<DealRow>> {
  const parsed = dealInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "deals:create")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select("id, pipeline_id")
    .eq("id", parsed.data.stage_id)
    .eq("org_id", org.id)
    .eq("pipeline_id", parsed.data.pipeline_id)
    .maybeSingle();

  if (stageError || !stage) {
    return { data: null, error: "Invalid stage for this pipeline" };
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({
      org_id: org.id,
      pipeline_id: parsed.data.pipeline_id,
      stage_id: parsed.data.stage_id,
      contact_id: parsed.data.contact_id ?? null,
      title: parsed.data.title,
      value: parsed.data.value,
      currency: parsed.data.currency,
      owner_id: parsed.data.owner_id ?? user?.id ?? null,
    })
    .select(
      "id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status, owner_id, closed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    console.error("[deals:createDeal]", error?.message);
    return { data: null, error: "Could not create deal" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "created",
    entityType: "deal",
    entityId: data.id,
    meta: { title: data.title, stage_id: data.stage_id },
  });

  return { data: data as DealRow, error: null };
}

export async function updateDeal(
  id: string,
  input: z.input<typeof dealUpdateSchema>,
): Promise<ActionResult<DealRow>> {
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) {
    return { data: null, error: "Invalid deal" };
  }

  const parsed = dealUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (Object.keys(parsed.data).length === 0) {
    return { data: null, error: "Nothing to update" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "deals:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (parsed.data.stage_id) {
    const { data: existing } = await supabase
      .from("deals")
      .select("pipeline_id")
      .eq("id", idParsed.data)
      .eq("org_id", org.id)
      .maybeSingle();

    if (!existing) {
      return { data: null, error: "Deal not found" };
    }

    const { data: stage } = await supabase
      .from("stages")
      .select("id")
      .eq("id", parsed.data.stage_id)
      .eq("org_id", org.id)
      .eq("pipeline_id", existing.pipeline_id)
      .maybeSingle();

    if (!stage) {
      return { data: null, error: "Invalid stage for this deal" };
    }
  }

  const { data, error } = await supabase
    .from("deals")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", idParsed.data)
    .eq("org_id", org.id)
    .select(
      "id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status, owner_id, closed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    console.error("[deals:updateDeal]", error?.message);
    return { data: null, error: "Could not update deal" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "updated",
    entityType: "deal",
    entityId: data.id,
    meta: { title: data.title, stage_id: data.stage_id, status: data.status },
  });

  return { data: data as DealRow, error: null };
}

export async function moveDeal(
  dealId: string,
  stageId: string,
): Promise<ActionResult<DealRow>> {
  const dealParsed = idSchema.safeParse(dealId);
  const stageParsed = idSchema.safeParse(stageId);
  if (!dealParsed.success || !stageParsed.success) {
    return { data: null, error: "Invalid deal or stage" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "deals:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, pipeline_id")
    .eq("id", dealParsed.data)
    .eq("org_id", org.id)
    .maybeSingle();

  if (dealError || !deal) {
    return { data: null, error: "Deal not found" };
  }

  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select("id")
    .eq("id", stageParsed.data)
    .eq("org_id", org.id)
    .eq("pipeline_id", deal.pipeline_id)
    .maybeSingle();

  if (stageError || !stage) {
    return { data: null, error: "Invalid stage for this deal" };
  }

  const { data, error } = await supabase
    .from("deals")
    .update({
      stage_id: stageParsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealParsed.data)
    .eq("org_id", org.id)
    .select(
      "id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status, owner_id, closed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    console.error("[deals:moveDeal]", error?.message);
    return { data: null, error: "Could not move deal" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "moved",
    entityType: "deal",
    entityId: data.id,
    meta: { title: data.title, stage_id: data.stage_id },
  });

  return { data: data as DealRow, error: null };
}

export async function setDealStatus(
  dealId: string,
  status: "won" | "lost",
): Promise<ActionResult<DealRow>> {
  const dealParsed = idSchema.safeParse(dealId);
  const statusParsed = z.enum(["won", "lost"]).safeParse(status);
  if (!dealParsed.success || !statusParsed.success) {
    return { data: null, error: "Invalid deal or status" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "deals:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("deals")
    .update({
      status: statusParsed.data,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealParsed.data)
    .eq("org_id", org.id)
    .select(
      "id, org_id, pipeline_id, stage_id, contact_id, title, value, currency, status, owner_id, closed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    console.error("[deals:setDealStatus]", error?.message);
    return { data: null, error: "Could not update deal status" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "status_changed",
    entityType: "deal",
    entityId: data.id,
    meta: { title: data.title, status: data.status },
  });

  return { data: data as DealRow, error: null };
}

export async function deleteDeal(
  dealId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = idSchema.safeParse(dealId);
  if (!parsed.success) {
    return { data: null, error: "Invalid deal" };
  }

  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "deals:delete")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", parsed.data)
    .eq("org_id", org.id);

  if (error) {
    console.error("[deals:deleteDeal]", error.message);
    return { data: null, error: "Could not delete deal" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "deleted",
    entityType: "deal",
    entityId: parsed.data,
  });

  return { data: { id: parsed.data }, error: null };
}
