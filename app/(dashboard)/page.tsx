import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-grow items-center justify-center px-6 py-16">
      <div className="grid w-full grid-cols-4 gap-6 md:grid-cols-12">
        <div className="col-span-4 flex flex-col items-center justify-center text-center md:col-span-6 md:col-start-4">
          <div className="mb-6 flex size-24 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container">
            <BarChart3
              className="size-10 text-secondary/60"
              strokeWidth={1.25}
            />
          </div>
          <h1 className="font-headline mb-3 text-[32px] leading-tight tracking-tight text-on-surface">
            No sales activity yet.
          </h1>
          <p className="mb-8 max-w-sm text-lg leading-relaxed text-secondary">
            Your pipeline is currently clear. Start building your momentum by
            adding your first prospect to the system.
          </p>
          <Link
            href="#"
            className="flex items-center gap-2 rounded bg-primary-container px-6 py-3 text-xs font-medium tracking-wide text-on-primary uppercase shadow-sm transition-all hover:bg-surface-tint active:scale-95"
          >
            <Plus className="size-[18px]" />
            Add your first lead
          </Link>
        </div>
      </div>
    </main>
  );
}
