import { createClient } from "@/lib/supabase/server";

export async function writeActivity(input: {
  orgId: string;
  actorId: string | null;
  verb: string;
  entityType: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    org_id: input.orgId,
    actor_id: input.actorId,
    verb: input.verb,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    meta: input.meta ?? {},
  });

  if (error) {
    console.error("[activity:write]", error.message);
  }
}
