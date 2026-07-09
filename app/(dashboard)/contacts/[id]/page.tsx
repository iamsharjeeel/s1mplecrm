import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getContact } from "@/actions/contacts";
import { listContactEmails } from "@/actions/emails";
import { listTasks } from "@/actions/tasks";
import { ContactDetail } from "@/components/contacts/contact-detail";
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

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const { id } = await params;
  const contactResult = await getContact(id);
  if (contactResult.error || !contactResult.data) notFound();

  const contact = contactResult.data;
  const supabase = await createClient();

  const [emailsResult, tasksResult, activitiesResult] = await Promise.all([
    listContactEmails(id),
    listTasks(),
    supabase
      .from("activities")
      .select("id, verb, entity_type, entity_id, meta, created_at")
      .eq("org_id", org.id)
      .or(
        `and(entity_type.eq.contact,entity_id.eq.${id}),meta->>contact_id.eq.${id}`,
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const tasks = (tasksResult.data ?? []).filter(
    (t) => t.related_contact_id === id,
  );

  const activities = (activitiesResult.data ?? []) as ActivityRow[];

  const name =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed";

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <Link
        href="/contacts"
        className="mb-6 inline-block text-sm text-secondary hover:text-primary"
      >
        ← Back to contacts
      </Link>

      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">{name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-secondary">
          {contact.email ? <span>{contact.email}</span> : null}
          {contact.phone ? <span>{contact.phone}</span> : null}
          {contact.company ? <span>{contact.company}</span> : null}
        </div>
        {contact.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-secondary-container bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ContactDetail
        contactId={contact.id}
        contactEmail={contact.email}
        emails={emailsResult.data ?? []}
        tasks={tasks}
        activities={activities}
      />
    </main>
  );
}
