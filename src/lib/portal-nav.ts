import type { IconName } from "@/components/shared/icons";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
  /** Stricter than adminOnly: hidden from admins too. For switches that change
   *  the site for everyone, not just this home's day-to-day running. */
  superAdminOnly?: boolean;
}

// Main nav. Stock & Meal report are visible to all staff; Rooms is admin-only.
export const PORTAL_NAV: PortalNavItem[] = [
  { href: "/portal", label: "Dashboard", icon: "home" },
  { href: "/portal/stock", label: "Stock & supplies", icon: "stock" },
  { href: "/portal/meal-report", label: "Meal report", icon: "mealreport" },
  { href: "/portal/rooms", label: "Rooms", icon: "rooms", adminOnly: true },
  { href: "/portal/residents", label: "Residents", icon: "residents" },
  { href: "/portal/roster", label: "Roster & shifts", icon: "roster" },
  { href: "/portal/meals", label: "Meals & dietary", icon: "meals" },
  { href: "/portal/activities", label: "Activities", icon: "activities" },
  { href: "/portal/family", label: "Family portal", icon: "family" },
];

// Administration group (admin only).
export const PORTAL_ADMIN_NAV: PortalNavItem[] = [
  { href: "/portal/buildings", label: "Buildings", icon: "buildings" },
  { href: "/portal/incidents", label: "Incidents & compliance", icon: "incidents" },
  { href: "/portal/forms", label: "Forms", icon: "forms" },
  { href: "/portal/users", label: "Users & access", icon: "users" },
  { href: "/portal/staff", label: "Staff", icon: "staff" },
  { href: "/portal/settings", label: "Settings", icon: "settings", adminOnly: true, superAdminOnly: true },
  { href: "/portal/website", label: "Website", icon: "website", adminOnly: true },
];

/** Screens the visibility switch refuses to touch. The dashboard is where a
 *  hidden screen's route guard sends people, and Settings holds the switch -
 *  hiding either would strand an admin with no way back. */
export const ALWAYS_VISIBLE: string[] = ["/portal", "/portal/settings"];

/** Every screen an admin may switch off, in nav order. */
export function hideableScreens(): PortalNavItem[] {
  return [...PORTAL_NAV, ...PORTAL_ADMIN_NAV].filter((i) => !ALWAYS_VISIBLE.includes(i.href));
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}
