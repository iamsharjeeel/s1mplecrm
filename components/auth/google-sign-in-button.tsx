"use client";

import { useTransition } from "react";
import { signInWithGoogle } from "@/actions/auth";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.31H19.29C21.37 18.39 22.56 15.58 22.56 12.25Z"
        fill="#4285F4"
      />
      <path
        d="M12 23C14.97 23 17.46 22.02 19.29 20.31L15.73 17.57C14.74 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.7 5.83 14.12H2.15V16.98C3.96 20.57 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.83 14.12C5.61 13.46 5.48 12.75 5.48 12C5.48 11.25 5.61 10.54 5.83 9.88V7.02H2.15C1.41 8.5 1 10.2 1 12C1 13.8 1.41 15.5 2.15 16.98L5.83 14.12Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.38 3.84C17.45 2.04 14.97 1 12 1C7.7 1 3.96 3.43 2.15 7.02L5.83 9.88C6.7 7.3 9.13 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signInWithGoogle();
        });
      }}
      className="flex w-full items-center justify-center gap-3 rounded border border-secondary-container bg-surface-container-lowest px-4 py-3 text-base text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
    >
      <GoogleMark />
      {pending ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
