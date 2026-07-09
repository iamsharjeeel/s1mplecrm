"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "@/actions/orgs";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-headline mb-2 text-3xl text-on-surface">
        Create your workspace
      </h1>
      <p className="mb-8 text-base text-secondary">
        Organizations keep contacts, deals, and team data isolated.
      </p>
      <form
        className="flex flex-col gap-4 rounded-xl border border-secondary-container bg-surface-container-lowest p-8 shadow-confidence"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await createOrganization(name);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.replace("/");
            router.refresh();
          });
        }}
      >
        <label className="text-sm text-on-surface-variant">
          Organization name
          <input
            className="mt-2 w-full rounded border border-secondary-container bg-surface-container-lowest px-4 py-3 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            placeholder="Acme Sales"
          />
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary-container px-4 py-3 text-xs font-medium tracking-wide text-on-primary uppercase hover:bg-primary disabled:opacity-50"
        >
          {pending ? "Creating…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
