import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Plus, Users, Kanban } from "lucide-react";
import { getActiveOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const [{ count: contactCount }, { count: dealCount }, { count: taskCount }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "open"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .is("completed_at", null),
    ]);

  const empty = (contactCount ?? 0) === 0 && (dealCount ?? 0) === 0;

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-12">
      {empty ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <div className="mb-6 flex size-24 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container">
            <BarChart3 className="size-10 text-secondary/60" strokeWidth={1.25} />
          </div>
          <h1 className="font-headline mb-3 text-[32px] text-on-surface">
            No sales activity yet.
          </h1>
          <p className="mb-8 max-w-sm text-lg text-secondary">
            Your pipeline is clear. Add your first prospect to get started.
          </p>
          <Link
            href="/contacts"
            className="flex items-center gap-2 rounded bg-primary-container px-6 py-3 text-xs font-medium tracking-wide text-on-primary uppercase hover:bg-surface-tint"
          >
            <Plus className="size-[18px]" />
            Add your first lead
          </Link>
        </div>
      ) : (
        <div>
          <h1 className="font-headline mb-2 text-3xl text-on-surface">
            {org.name}
          </h1>
          <p className="mb-10 text-secondary">Workspace overview</p>
          <div className="grid gap-6 sm:grid-cols-3">
            <Link
              href="/contacts"
              className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6 hover:border-outline-variant"
            >
              <Users className="mb-3 size-5 text-primary-container" />
              <p className="text-sm text-secondary">Contacts</p>
              <p className="font-headline text-3xl text-on-surface">
                {contactCount ?? 0}
              </p>
            </Link>
            <Link
              href="/pipeline"
              className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6 hover:border-outline-variant"
            >
              <Kanban className="mb-3 size-5 text-primary-container" />
              <p className="text-sm text-secondary">Open deals</p>
              <p className="font-headline text-3xl text-on-surface">
                {dealCount ?? 0}
              </p>
            </Link>
            <Link
              href="/tasks"
              className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6 hover:border-outline-variant"
            >
              <BarChart3 className="mb-3 size-5 text-primary-container" />
              <p className="text-sm text-secondary">Open tasks</p>
              <p className="font-headline text-3xl text-on-surface">
                {taskCount ?? 0}
              </p>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
