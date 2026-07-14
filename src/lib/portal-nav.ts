import type { IconName } from "@/components/shared/icons";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
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
  { href: "/portal/users", label: "Users & access", icon: "users" },
  { href: "/portal/staff", label: "Staff", icon: "staff" },
];

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}
