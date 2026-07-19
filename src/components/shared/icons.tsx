import { cn } from "@/lib/utils";

// Inline line-icon set ported from the design (stroke 1.8, currentColor).
// Keys are referenced from data (marketing feature icons, portal nav).
const PATHS: Record<string, string> = {
  home: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  residents:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 12 0v1"/><path d="M16 3.5a3 3 0 0 1 0 7"/><path d="M21 21v-1a6 6 0 0 0-3-5"/>',
  roster: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  website:
    '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 9h18"/><path d="M6.5 6.5h.01M9 6.5h.01"/>',
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
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  staff:
    '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  mealreport: '<path d="M9 3v6a3 3 0 0 1-6 0V3M6 3v18"/><path d="M15 3v18M18 3v7h3M18 10a3 3 0 0 0 3-3V3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  buildings: '<path d="M3 21V7l8-4v18"/><path d="M11 21V9l8 3v9"/><path d="M2 21h20"/><path d="M7 9v.01M7 13v.01M7 17v.01"/>',
  "chevron-left": '<path d="M15 6l-6 6 6 6"/>',
  "chevron-right": '<path d="M9 6l6 6-6 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  history:
    '<path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.13-8.36L3 8"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
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
