import { cn } from "@/lib/utils";

// Colored initials badge. The bg color is per-record DATA (resident/staff
// color), so it's applied via inline style — the one sanctioned inline-color
// exception (see docs/00-rules §5).
export function PersonBadge({
  initials,
  color,
  className,
  serif = false,
}: {
  initials: string;
  color: string;
  /** controls size + radius via utility classes, e.g. "size-9 rounded-full text-[12px]" */
  className?: string;
  serif?: boolean;
}) {
  return (
    <span
      style={{ backgroundColor: color }}
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-white",
        serif && "font-serif font-semibold",
        className,
      )}
    >
      {initials}
    </span>
  );
}
