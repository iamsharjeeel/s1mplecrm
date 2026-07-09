"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, Users } from "lucide-react";
import { createInvite } from "@/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role } from "@/lib/permissions";

type MemberRow = {
  user_id: string;
  role: Role;
  joined_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function TeamClient({
  members,
  currentRole,
  error: initialError,
}: {
  members: MemberRow[];
  currentRole: Role;
  error: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canInvite = currentRole === "owner" || currentRole === "admin";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Team</h1>
        <p className="mt-1 text-secondary">Members and invitations</p>
      </div>

      {canInvite ? (
        <form
          className="mb-8 rounded-xl border border-secondary-container bg-surface-container-lowest p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);
            startTransition(async () => {
              const result = await createInvite(email, role);
              if (result.error) {
                setError(result.error);
                return;
              }
              setSuccess(`Invite sent to ${email}`);
              setEmail("");
              router.refresh();
            });
          }}
        >
          <h2 className="font-headline mb-4 flex items-center gap-2 text-xl text-on-surface">
            <UserPlus className="size-5 text-primary-container" />
            Invite member
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 border-secondary-container bg-surface-container-lowest"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className="rounded border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
          {success ? (
            <p className="mt-3 text-sm text-primary-container">{success}</p>
          ) : null}
        </form>
      ) : null}

      <div className="mb-6 rounded-xl border border-secondary-container bg-surface-container p-4 text-sm text-on-surface-variant">
        <p className="font-medium text-on-surface">Role permissions</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-secondary">
          <li>
            <strong className="text-on-surface">Owner</strong> — full access,
            billing, delete org
          </li>
          <li>
            <strong className="text-on-surface">Admin</strong> — manage team,
            settings, all CRM data
          </li>
          <li>
            <strong className="text-on-surface">Member</strong> — create and
            edit contacts, deals, tasks; send emails
          </li>
        </ul>
      </div>

      {members.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-xl border border-secondary-container bg-surface-container-lowest py-12 text-center">
          <Users className="mb-4 size-10 text-secondary/60" strokeWidth={1.25} />
          <p className="text-secondary">No members found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-secondary-container rounded-xl border border-secondary-container bg-surface-container-lowest">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low"
            >
              <div>
                <p className="font-mono text-sm text-on-surface">
                  {m.user_id.slice(0, 8)}…
                </p>
                <p className="text-xs text-secondary">
                  Joined {formatDate(m.joined_at)}
                </p>
              </div>
              <span className="rounded border border-secondary-container bg-surface-container px-2 py-0.5 text-xs font-medium tracking-wide text-on-surface-variant uppercase">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
