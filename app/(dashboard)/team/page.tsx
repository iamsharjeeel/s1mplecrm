import { redirect } from "next/navigation";
import { listMembers } from "@/actions/invites";
import { TeamClient } from "@/components/team/team-client";
import { getActiveOrg } from "@/lib/org";

export default async function TeamPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const result = await listMembers();

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <TeamClient
        members={result.data ?? []}
        currentRole={org.role}
        error={result.error}
      />
    </main>
  );
}
