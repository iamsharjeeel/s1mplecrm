"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signUp, type AuthActionResult } from "@/actions/auth";
import { FloatingInput } from "@/components/auth/floating-input";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initial: AuthActionResult = { data: null, error: null };

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initial);

  return (
    <div className="w-full rounded-xl border border-secondary-container bg-surface-container-lowest p-8 shadow-confidence sm:p-12">
      <div className="mb-8 text-center">
        <h2 className="font-headline mb-2 text-2xl leading-snug text-on-surface">
          Create account
        </h2>
        <p className="text-base text-on-surface-variant">
          Get started with your workspace
        </p>
      </div>

      <div className="mb-6">
        <GoogleSignInButton />
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-secondary-container" />
        <span className="mx-4 flex-shrink-0 text-xs font-medium tracking-wider text-on-surface-variant uppercase">
          Or
        </span>
        <div className="flex-grow border-t border-secondary-container" />
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <FloatingInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FloatingInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.error ? (
          <p className="text-sm text-error">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 text-xs font-medium tracking-wide text-on-primary uppercase transition-colors hover:bg-primary disabled:opacity-50"
        >
          {pending ? "Creating…" : "Sign Up"}
          <ArrowRight className="size-[18px]" />
        </button>
      </form>

      <p className="mt-8 text-center text-base text-on-surface-variant">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-xs font-medium tracking-wide text-primary-container uppercase transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
