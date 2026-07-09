import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <header className="mb-12 w-full text-center">
          <h1 className="font-headline text-2xl tracking-widest text-primary uppercase">
            S1mpleCRM
          </h1>
        </header>
        <SignUpForm />
      </div>
    </main>
  );
}
