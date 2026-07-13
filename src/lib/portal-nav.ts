import type { IconName } from "@/components/shared/icons";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
}

// Main nav (Rooms is admin-only but lives in the main list).
export const PORTAL_NAV: PortalNavItem[] = [
  { href: "/portal", label: "Dashboard", icon: "home" },
  { href: "/portal/rooms", label: "Rooms", icon: "rooms", adminOnly: true },
  { href: "/portal/residents", label: "Residents", icon: "residents" },
  { href: "/portal/roster", label: "Roster & shifts", icon: "roster" },
  { href: "/portal/meals", label: "Meals & dietary", icon: "meals" },
  { href: "/portal/activities", label: "Activities", icon: "activities" },
  { href: "/portal/family", label: "Family portal", icon: "family" },
];

// Administration group (admin only).
export const PORTAL_ADMIN_NAV: PortalNavItem[] = [
  { href: "/portal/stock", label: "Stock & supplies", icon: "stock" },
  { href: "/portal/incidents", label: "Incidents & compliance", icon: "incidents" },
];

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}
