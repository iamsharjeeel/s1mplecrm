import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <p className="text-3xl font-semibold tracking-tight">S1mpleCRM</p>
        <SignUpForm />
      </div>
    </main>
  );
}
