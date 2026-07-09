import { redirect } from "next/navigation";
import { listContacts } from "@/actions/contacts";
import { ContactsClient } from "@/components/contacts/contacts-client";
import { getActiveOrg } from "@/lib/org";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const { q } = await searchParams;
  const result = await listContacts({ q });

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <ContactsClient
        initialContacts={result.data ?? []}
        initialQuery={q ?? ""}
        error={result.error}
      />
    </main>
  );
}
