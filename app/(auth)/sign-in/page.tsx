import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <p className="text-3xl font-semibold tracking-tight">S1mpleCRM</p>
        <SignInForm />
      </div>
    </main>
  );
}
