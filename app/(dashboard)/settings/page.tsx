import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { getActiveOrg } from "@/lib/org";

export default async function SettingsPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Settings</h1>
        <p className="mt-1 text-secondary">Organization profile</p>
      </div>
      <SettingsForm orgName={org.name} logoUrl={org.logo_url} role={org.role} />
    </main>
  );
}
