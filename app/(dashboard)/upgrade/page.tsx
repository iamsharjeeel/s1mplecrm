import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveOrg, getOrgPlan } from "@/lib/org";
import { PLAN_LIMITS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export default async function UpgradePage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const { plan } = await getOrgPlan(org.id);

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Upgrade</h1>
        <p className="mt-1 text-secondary">
          Current plan:{" "}
          <span className="font-medium capitalize text-on-surface">{plan}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-secondary-container bg-surface-container-lowest p-8">
          <h2 className="font-headline mb-2 text-2xl text-on-surface">Free</h2>
          <p className="mb-6 text-secondary">For small teams getting started</p>
          <ul className="mb-8 space-y-2 text-sm text-on-surface-variant">
            <li>{PLAN_LIMITS.free.contacts.toLocaleString()} contacts</li>
            <li>{PLAN_LIMITS.free.members} team members</li>
            <li>{PLAN_LIMITS.free.pipelines} pipeline</li>
          </ul>
          <Button variant="outline" disabled className="w-full">
            {plan === "free" ? "Current plan" : "Coming soon"}
          </Button>
        </div>

        <div className="rounded-xl border-2 border-primary-container bg-surface-container-lowest p-8 shadow-confidence">
          <h2 className="font-headline mb-2 text-2xl text-on-surface">Pro</h2>
          <p className="mb-6 text-secondary">For growing sales teams</p>
          <ul className="mb-8 space-y-2 text-sm text-on-surface-variant">
            <li>{PLAN_LIMITS.pro.contacts.toLocaleString()} contacts</li>
            <li>{PLAN_LIMITS.pro.members} team members</li>
            <li>{PLAN_LIMITS.pro.pipelines} pipelines</li>
          </ul>
          <Button disabled className="w-full">
            Coming soon
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-secondary">
        <Link href="/" className="text-primary-container hover:underline">
          Back to dashboard
        </Link>
      </p>
    </main>
  );
}
