import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foundation shell — contacts, pipeline, and tasks arrive in later phases.
        </p>
      </div>
      <div className="rounded-lg border border-border px-4 py-6">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-1 font-medium">{user?.email ?? "Unknown"}</p>
      </div>
    </main>
  );
}
