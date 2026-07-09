import { redirect } from "next/navigation";
import { listTasks } from "@/actions/tasks";
import { TasksClient } from "@/components/tasks/tasks-client";
import { getActiveOrg } from "@/lib/org";

export default async function TasksPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const result = await listTasks();

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <TasksClient initialTasks={result.data ?? []} error={result.error} />
    </main>
  );
}
