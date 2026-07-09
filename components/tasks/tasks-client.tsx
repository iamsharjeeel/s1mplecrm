"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckSquare } from "lucide-react";
import { toggleTaskComplete } from "@/actions/tasks";
import { cn } from "@/lib/utils";

type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TasksClient({
  initialTasks,
  error: initialError,
}: {
  initialTasks: TaskRow[];
  error: string | null;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();

  const open = tasks.filter((t) => !t.completed_at);
  const done = tasks.filter((t) => t.completed_at);

  function toggle(id: string) {
    startTransition(async () => {
      const result = await toggleTaskComplete(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? result.data! : t)),
        );
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Tasks</h1>
        <p className="mt-1 text-secondary">Track follow-ups and to-dos</p>
      </div>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      {tasks.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-secondary-container bg-surface-container-lowest py-16 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container">
            <CheckSquare
              className="size-9 text-secondary/60"
              strokeWidth={1.25}
            />
          </div>
          <h2 className="font-headline mb-2 text-2xl text-on-surface">
            No tasks yet
          </h2>
          <p className="max-w-sm text-secondary">
            Tasks linked to contacts or deals will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-on-surface-variant uppercase">
                Open ({open.length})
              </h2>
              <ul className="divide-y divide-secondary-container rounded-xl border border-secondary-container bg-surface-container-lowest">
                {open.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low"
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      disabled={pending}
                      onChange={() => toggle(task.id)}
                      className="mt-1 size-4 rounded-none border-secondary-container accent-primary-container"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-on-surface">{task.title}</p>
                      {task.due_at ? (
                        <p className="text-xs text-secondary">
                          Due {formatDate(task.due_at)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {done.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-on-surface-variant uppercase">
                Completed ({done.length})
              </h2>
              <ul className="divide-y divide-secondary-container rounded-xl border border-secondary-container bg-surface-container-lowest">
                {done.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low"
                  >
                    <input
                      type="checkbox"
                      checked
                      disabled={pending}
                      onChange={() => toggle(task.id)}
                      className="mt-1 size-4 rounded-none border-secondary-container accent-primary-container"
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm text-secondary line-through",
                        )}
                      >
                        {task.title}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
