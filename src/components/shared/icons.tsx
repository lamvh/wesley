import { cn } from "@/lib/utils";

// Inline line-icon set ported from the design (stroke 1.8, currentColor).
// Keys are referenced from data (marketing feature icons, portal nav).
const PATHS: Record<string, string> = {
  home: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  residents:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M16 3.5a3 3 0 0 1 0 7"/><path d="M21 21v-1a6 6 0 0 0-3-5"/>',
  roster: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  meals: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18"/><path d="M17 3c-2 1-3 3-3 6s1 4 3 4v8"/>',
  activities: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  family: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  stock: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  incidents: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  cake: '<path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16c1.5 0 1.5 1.2 3 1.2S10.5 16 12 16s1.5 1.2 3 1.2S19.5 16 20 16"/><path d="M12 5v3M12 3.5v.01"/>',
  rooms:
    '<path d="M3 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16"/><path d="M15 21V9h4a1 1 0 0 1 1 1v11"/><path d="M2 21h20"/><path d="M11 12h.01"/>',
  garden: '<path d="M12 22V8M12 8a5 5 0 0 0-5-5 5 5 0 0 0 5 5zM12 8a5 5 0 0 1 5-5 5 5 0 0 1-5 5z"/>',
  wellbeing: '<path d="M20 8.5a5 5 0 0 0-8-4 5 5 0 0 0-8 4c0 5 8 10 8 10s8-5 8-10z"/>',
  salon: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M14 10l6 10"/>',
};

export type IconName = keyof typeof PATHS | string;

export function Icon({
  name,
  size = 19,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const d = PATHS[name] ?? PATHS.activities;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}
