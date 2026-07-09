import { redirect } from "next/navigation";
import { getActiveOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/dashboard/top-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const org = await getActiveOrg();

  let orgs: { id: string; name: string; role: string }[] = [];
  if (org) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("role, org_id, organizations(id, name)")
      .eq("user_id", user.id);

    orgs =
      memberships
        ?.map((m) => {
          const o = Array.isArray(m.organizations)
            ? m.organizations[0]
            : m.organizations;
          return {
            id: (o as { id: string } | null)?.id ?? "",
            name: (o as { name: string } | null)?.name ?? "",
            role: m.role as string,
          };
        })
        .filter((o) => o.id) ?? [];
  }

  return (
    <div className="flex min-h-svh flex-col bg-linen">
      {org ? (
        <TopNav
          orgs={orgs}
          activeOrgId={org.id}
          userEmail={user.email ?? null}
        />
      ) : null}
      {children}
    </div>
  );
}
