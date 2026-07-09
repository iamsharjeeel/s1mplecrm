"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn, signInWithMagicLink, type AuthActionResult } from "@/actions/auth";
import { FloatingInput } from "@/components/auth/floating-input";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initial: AuthActionResult = { data: null, error: null };

export function SignInForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signIn,
    initial,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initial,
  );

  const magicSent = magicState.data?.sent === true;

  return (
    <div className="w-full rounded-xl border border-secondary-container bg-surface-container-lowest p-8 shadow-confidence sm:p-12">
      <div className="mb-8 text-center">
        <h2 className="font-headline mb-2 text-2xl leading-snug text-on-surface">
          Welcome back
        </h2>
        <p className="text-base text-on-surface-variant">
          Sign in to continue to your workspace
        </p>
      </div>

      <form action={passwordAction} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          minLength={8}
        />
        {passwordState.error ? (
          <p className="text-sm text-error">{passwordState.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={passwordPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-primary-container px-4 py-3 text-xs font-medium tracking-wide text-on-primary uppercase transition-colors hover:bg-primary disabled:opacity-50"
        >
          {passwordPending ? "Signing in…" : "Sign In"}
          <ArrowRight className="size-[18px]" />
        </button>
      </form>

      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-secondary-container" />
        <span className="mx-4 flex-shrink-0 text-xs font-medium tracking-wider text-on-surface-variant uppercase">
          Or
        </span>
        <div className="flex-grow border-t border-secondary-container" />
      </div>

      <div className="flex flex-col gap-2">
        <GoogleSignInButton />
      </div>

      <form action={magicAction} className="mt-4 flex flex-col gap-3">
        <FloatingInput
          label="Email for magic link"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {magicState.error ? (
          <p className="text-sm text-error">{magicState.error}</p>
        ) : null}
        {magicSent ? (
          <p className="text-sm text-on-surface-variant">
            Check your email for a sign-in link.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={magicPending}
          className="w-full rounded border border-secondary-container bg-surface-container-lowest px-4 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
        >
          {magicPending ? "Sending…" : "Send magic link"}
        </button>
      </form>

      <p className="mt-8 text-center text-base text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-xs font-medium tracking-wide text-primary-container uppercase transition-colors hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
