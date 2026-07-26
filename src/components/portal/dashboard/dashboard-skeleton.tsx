import { cn } from "@/lib/utils";

// Placeholder block - pulses while dashboard data loads.
function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[14px] bg-line/70", className)} />;
}

// Loading-state mirror of DashboardView: same grid rhythm (header → 3 KPIs →
// birthday strip → the alerts card) so the swap to real content is seamless.
// It has to track that layout - it was already a row out of date, showing two
// split rows the screen had stopped rendering. The KPI count tracks
// getDashboardKpis(), which returns only figures with a real source; a fourth
// block here would flash a card that never arrives.
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1180px]" aria-busy="true" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-8 w-56 max-sm:w-40" />
          <Block className="h-4 w-80 max-sm:w-56" />
        </div>
        <div className="flex gap-2 max-sm:hidden">
          <Block className="h-11 w-32" />
          <Block className="h-11 w-28" />
        </div>
      </div>

      <div className="mt-[26px] grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Block key={i} className="h-[104px]" />
        ))}
      </div>

      <Block className="mt-4 h-[68px]" />

      <Block className="mt-4 h-[220px]" />
    </div>
  );
}
