import { signOut } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded px-2 py-1 text-xs font-medium tracking-wide text-secondary uppercase transition-colors hover:bg-surface-container-low hover:text-primary"
      >
        Sign out
      </button>
    </form>
  );
}
