import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <header className="mb-12 w-full text-center">
          <h1 className="font-headline text-2xl tracking-widest text-primary uppercase">
            S1mpleCRM
          </h1>
        </header>
        {error === "auth_callback" ? (
          <p className="mb-4 w-full rounded border border-error/30 bg-error-container px-4 py-3 text-sm text-error">
            Google sign-in didn&apos;t complete. Try again — if you started on
            production, use{" "}
            <a className="underline" href="https://s1mplecrm.vercel.app/sign-in">
              s1mplecrm.vercel.app
            </a>
            .
          </p>
        ) : null}
        <SignInForm />
      </div>
    </main>
  );
}
