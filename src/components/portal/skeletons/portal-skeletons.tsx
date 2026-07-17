import { cn } from "@/lib/utils";

// Shared loading placeholders for portal route segments (rendered from each
// route's loading.tsx as the Suspense fallback). Same visual language as
// DashboardSkeleton - a pulsing rounded block on the line tint - so every
// screen's loading state reads as one system.

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[14px] bg-line/70", className)} />;
}

// Mirrors PortalPageHeader: serif title + sub on the left, action buttons right.
function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-56 max-sm:w-40" />
        <SkeletonBlock className="h-4 w-80 max-sm:w-56" />
      </div>
      <div className="flex gap-[10px] max-sm:hidden">
        <SkeletonBlock className="h-11 w-28" />
        <SkeletonBlock className="h-11 w-24" />
      </div>
    </div>
  );
}

function GridSkeleton({ count, cols }: { count: number; cols: 2 | 3 }) {
  const colClass =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";
  return (
    <div className={cn("mt-[22px] grid gap-[14px]", colClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-[168px]" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-[22px] space-y-4">
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-9 w-28" />
        <SkeletonBlock className="h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-[14px] border border-line">
        <SkeletonBlock className="h-12 rounded-none bg-line/50" />
        <div className="space-y-px">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBlock key={i} className="h-14 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-[22px] grid gap-4 lg:grid-cols-[1fr_1.6fr]">
      <SkeletonBlock className="h-[320px]" />
      <div className="space-y-4">
        <SkeletonBlock className="h-[150px]" />
        <SkeletonBlock className="h-[150px]" />
      </div>
    </div>
  );
}

type Variant = "grid" | "table" | "detail";

/**
 * Full-page portal loading skeleton: header + a body shaped to the page kind.
 * - grid   → card directories (residents, rooms, buildings, activities, family)
 * - table  → row-based screens (roster, incidents, users, stock, meals, reports)
 * - detail → single-record screens (resident / room detail)
 */
export function PortalPageSkeleton({
  variant = "grid",
  cols = 3,
  count = 6,
  rows = 6,
}: {
  variant?: Variant;
  cols?: 2 | 3;
  count?: number;
  rows?: number;
}) {
  return (
    <div className="mx-auto max-w-[1180px]" aria-busy="true" aria-live="polite">
      <HeaderSkeleton />
      {variant === "grid" && <GridSkeleton count={count} cols={cols} />}
      {variant === "table" && <TableSkeleton rows={rows} />}
      {variant === "detail" && <DetailSkeleton />}
    </div>
  );
}
