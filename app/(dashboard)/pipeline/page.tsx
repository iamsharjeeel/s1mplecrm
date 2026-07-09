import { redirect } from "next/navigation";
import { listContacts } from "@/actions/contacts";
import { listPipelineBoard } from "@/actions/deals";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { getActiveOrg } from "@/lib/org";

export default async function PipelinePage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const [boardResult, contactsResult] = await Promise.all([
    listPipelineBoard(),
    listContacts(),
  ]);

  if (boardResult.error || !boardResult.data) {
    return (
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
        <h1 className="font-headline text-3xl text-on-surface">Pipeline</h1>
        <p className="mt-4 text-error">
          {boardResult.error ?? "Could not load pipeline"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <KanbanBoard
        board={boardResult.data}
        contacts={(contactsResult.data ?? []).map((c) => ({
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed",
        }))}
      />
    </main>
  );
}
