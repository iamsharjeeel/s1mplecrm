import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "#", label: "Contacts", disabled: true },
  { href: "#", label: "Pipeline", disabled: true },
  { href: "#", label: "Tasks", disabled: true },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-5">
        <p className="text-lg font-semibold tracking-tight">S1mpleCRM</p>
        <p className="text-xs text-muted-foreground">Phase 0 shell</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) =>
          item.disabled ? (
            <span
              key={item.label}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground/60"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}
