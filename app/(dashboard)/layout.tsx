import { TopNav } from "@/components/dashboard/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-linen">
      <TopNav active="Dashboard" />
      {children}
    </div>
  );
}
