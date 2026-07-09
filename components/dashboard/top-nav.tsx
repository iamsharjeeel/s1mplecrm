"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, Settings } from "lucide-react";
import { switchOrganization } from "@/actions/orgs";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; match: string }[] = [
  { href: "/", label: "Dashboard", match: "/" },
  { href: "/contacts", label: "Contacts", match: "/contacts" },
  { href: "/pipeline", label: "Pipeline", match: "/pipeline" },
  { href: "/tasks", label: "Tasks", match: "/tasks" },
  { href: "/activity", label: "Activity", match: "/activity" },
  { href: "/team", label: "Team", match: "/team" },
  { href: "/settings", label: "Settings", match: "/settings" },
];

type OrgOption = { id: string; name: string; role: string };

export function TopNav({
  orgs,
  activeOrgId,
  userEmail,
}: {
  orgs: OrgOption[];
  activeOrgId: string;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = (userEmail?.charAt(0) ?? "U").toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-headline shrink-0 text-lg font-bold tracking-[0.1em] text-primary"
          >
            S1mpleCRM
          </Link>
          <select
            className="max-w-[160px] truncate rounded border border-secondary-container bg-surface-container-lowest px-2 py-1 text-sm text-on-surface"
            value={activeOrgId}
            disabled={pending || orgs.length < 2}
            onChange={(e) => {
              const id = e.target.value;
              startTransition(async () => {
                await switchOrganization(id);
                router.refresh();
              });
            }}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <ul className="hidden h-full items-center gap-5 xl:flex">
          {links.map((item) => {
            const isActive =
              item.match === "/"
                ? pathname === "/"
                : pathname.startsWith(item.match);
            return (
              <li key={item.label} className="flex h-full items-end pb-4">
                <Link
                  href={item.href}
                  className={cn(
                    "pb-1 text-sm transition-colors",
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/upgrade"
            className="hidden rounded px-2 py-1 text-xs font-medium tracking-wide text-primary-container uppercase sm:inline"
          >
            Upgrade
          </Link>
          <Link
            href="/settings"
            className="rounded p-2 text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Settings"
          >
            <Settings className="size-5" strokeWidth={1.5} />
          </Link>
          <span className="rounded p-2 text-secondary" aria-hidden>
            <Bell className="size-5" strokeWidth={1.5} />
          </span>
          <div
            className="ml-1 flex size-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary-fixed text-xs font-semibold text-primary"
            title={userEmail ?? "User"}
          >
            {initial}
          </div>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
