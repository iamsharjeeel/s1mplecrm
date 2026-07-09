import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/actions/invites";
import { switchOrganization } from "@/actions/orgs";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=/invite/${token}`);
  }

  const result = await acceptInvite(token);

  if (result.error) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-12">
        <h1 className="font-headline mb-2 text-3xl text-on-surface">
          Invite error
        </h1>
        <p className="mb-8 text-secondary">{result.error}</p>
        <Link
          href="/"
          className="text-center text-sm text-primary-container hover:underline"
        >
          Go to dashboard
        </Link>
      </main>
    );
  }

  if (result.data?.orgId) {
    await switchOrganization(result.data.orgId);
  }

  redirect("/");
}
