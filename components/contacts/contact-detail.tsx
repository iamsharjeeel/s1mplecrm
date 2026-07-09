"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendContactEmail } from "@/actions/emails";
import { toggleTaskComplete } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type EmailRow = {
  id: string;
  subject: string;
  body_html: string;
  status: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
};

type ActivityRow = {
  id: string;
  verb: string;
  entity_type: string;
  meta: Record<string, unknown>;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function activityLabel(a: ActivityRow) {
  const meta = a.meta;
  if (a.entity_type === "contact" && meta.name) return String(meta.name);
  if (a.entity_type === "email" && meta.subject) return String(meta.subject);
  if (meta.title) return String(meta.title);
  return a.entity_type;
}

export function ContactDetail({
  contactId,
  contactEmail,
  emails: initialEmails,
  tasks: initialTasks,
  activities,
}: {
  contactId: string;
  contactEmail: string | null;
  emails: EmailRow[];
  tasks: TaskRow[];
  activities: ActivityRow[];
}) {
  const router = useRouter();
  const [emails, setEmails] = useState(initialEmails);
  const [tasks, setTasks] = useState(initialTasks);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-8">
        <section className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
          <h2 className="font-headline mb-4 text-xl text-on-surface">
            Send email
          </h2>
          {!contactEmail ? (
            <p className="text-sm text-secondary">
              This contact has no email address.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const result = await sendContactEmail(
                    contactId,
                    subject,
                    body.replace(/\n/g, "<br>"),
                  );
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  if (result.data) {
                    setEmails((prev) => [result.data!, ...prev]);
                  }
                  setSubject("");
                  setBody("");
                  router.refresh();
                });
              }}
            >
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="border-secondary-container bg-surface-container-lowest"
              />
              <Textarea
                placeholder="Message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="min-h-28 border-secondary-container bg-surface-container-lowest"
              />
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <Button type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send email"}
              </Button>
            </form>
          )}

          {emails.length > 0 ? (
            <ul className="mt-6 space-y-3 border-t border-secondary-container pt-6">
              {emails.map((email) => (
                <li key={email.id} className="text-sm">
                  <p className="font-medium text-on-surface">{email.subject}</p>
                  <p className="text-secondary">
                    {formatDate(email.created_at)} · {email.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
          <h2 className="font-headline mb-4 text-xl text-on-surface">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-secondary">No related tasks.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!task.completed_at}
                    disabled={pending}
                    onChange={() => {
                      startTransition(async () => {
                        const result = await toggleTaskComplete(task.id);
                        if (result.data) {
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === task.id ? result.data! : t,
                            ),
                          );
                        }
                        router.refresh();
                      });
                    }}
                    className="mt-1 size-4 rounded-none border-secondary-container accent-primary-container"
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm",
                        task.completed_at
                          ? "text-secondary line-through"
                          : "text-on-surface",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.due_at ? (
                      <p className="text-xs text-secondary">
                        Due {formatDate(task.due_at)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
        <h2 className="font-headline mb-4 text-xl text-on-surface">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-secondary">No activity yet.</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((a) => (
              <li
                key={a.id}
                className="border-b border-secondary-container pb-4 last:border-0 last:pb-0"
              >
                <p className="text-sm text-on-surface">
                  <span className="font-medium capitalize">{a.verb}</span>{" "}
                  {a.entity_type}{" "}
                  <span className="text-secondary">{activityLabel(a)}</span>
                </p>
                <p className="text-xs text-secondary">
                  {formatDate(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
