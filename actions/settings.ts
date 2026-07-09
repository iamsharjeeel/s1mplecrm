"use server";

import { writeActivity } from "@/lib/activity";
import { requireActiveOrg } from "@/lib/org";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T> = { data: T | null; error: string | null };

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function extensionForType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

export async function uploadOrgLogo(
  formData: FormData,
): Promise<ActionResult<{ logo_url: string }>> {
  let org;
  try {
    org = await requireActiveOrg();
  } catch {
    return { data: null, error: "No active organization" };
  }

  if (!can(org.role, "org:update")) {
    return { data: null, error: "You do not have permission for this action" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { data: null, error: "No file provided" };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { data: null, error: "Logo must be 2 MB or smaller" };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { data: null, error: "Logo must be PNG, JPEG, WebP, or SVG" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ext = extensionForType(file.type);
  const path = `${org.id}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[settings:uploadOrgLogo:upload]", uploadError.message);
    return { data: null, error: "Could not upload logo" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("org-logos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("organizations")
    .update({ logo_url: publicUrl })
    .eq("id", org.id)
    .select("logo_url")
    .single();

  if (error || !data) {
    console.error("[settings:uploadOrgLogo:update]", error?.message);
    return { data: null, error: "Could not save logo URL" };
  }

  await writeActivity({
    orgId: org.id,
    actorId: user?.id ?? null,
    verb: "updated",
    entityType: "organization",
    entityId: org.id,
    meta: { logo_url: data.logo_url },
  });

  return { data: { logo_url: data.logo_url ?? publicUrl }, error: null };
}
