import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; disabled?: boolean }[] = [
  { href: "/", label: "Dashboard" },
  { href: "#", label: "Contacts", disabled: true },
  { href: "#", label: "Pipeline", disabled: true },
  { href: "#", label: "Activity", disabled: true },
];

export async function TopNav({ active = "Dashboard" }: { active?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = (user?.email?.charAt(0) ?? "U").toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
        <Link
          href="/"
          className="font-headline shrink-0 text-lg font-bold tracking-[0.1em] text-primary"
        >
          S1mpleCRM
        </Link>

        <ul className="hidden h-full items-center gap-8 md:flex">
          {links.map((item) => {
            const isActive = item.label === active;
            if (item.disabled) {
              return (
                <li key={item.label} className="flex h-full items-end pb-4">
                  <span className="pb-1 text-base text-secondary/50">
                    {item.label}
                  </span>
                </li>
              );
            }
            return (
              <li key={item.label} className="flex h-full items-end pb-4">
                <Link
                  href={item.href}
                  className={cn(
                    "pb-1 text-base transition-colors",
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
          <button
            type="button"
            className="rounded p-2 text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="size-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="rounded p-2 text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="Settings"
          >
            <Settings className="size-5" strokeWidth={1.5} />
          </button>
          <div
            className="ml-2 flex size-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary-fixed text-xs font-semibold text-primary"
            title={user?.email ?? "User"}
          >
            {initial}
          </div>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
