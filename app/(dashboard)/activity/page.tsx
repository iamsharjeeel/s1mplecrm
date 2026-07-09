import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

type ActivityRow = {
  id: string;
  verb: string;
  entity_type: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function activitySummary(a: ActivityRow) {
  const meta = a.meta;
  if (meta.name) return String(meta.name);
  if (meta.title) return String(meta.title);
  if (meta.email) return String(meta.email);
  if (meta.subject) return String(meta.subject);
  return a.entity_type;
}

export default async function ActivityPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id, verb, entity_type, entity_id, meta, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const activities = (data ?? []) as ActivityRow[];

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Activity</h1>
        <p className="mt-1 text-secondary">Recent workspace events</p>
      </div>

      {error ? (
        <p className="text-error">Could not load activity</p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-secondary-container bg-surface-container-lowest py-16 text-center">
          <p className="font-headline text-xl text-on-surface">No activity yet</p>
          <p className="mt-2 text-secondary">
            Actions across contacts, deals, and team will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-secondary-container rounded-xl border border-secondary-container bg-surface-container-lowest">
          {activities.map((a) => (
            <li key={a.id} className="px-6 py-4 hover:bg-surface-container-low">
              <p className="text-sm text-on-surface">
                <span className="font-medium capitalize">{a.verb}</span>{" "}
                <span className="text-secondary">{a.entity_type}</span>{" "}
                {activitySummary(a)}
              </p>
              <p className="mt-1 text-xs text-secondary">
                {formatDate(a.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
