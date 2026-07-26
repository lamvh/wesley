import type { Alert, Dashboard, PortalRole } from "@/types/domain";

// Greeting + alerts only. KPIs used to live here as two hardcoded sets of four;
// they are live now and NOT role-branched (lib/data/dashboard.ts) - occupancy
// and headcount are the same facts whoever is looking. The alert rows below are
// the remaining mock content on this screen.

// ---- admin-specific ----
const adminAlerts: Alert[] = [
  { title: "Nitrile gloves (M) below par", detail: "Clinical · 4 boxes left of 20 par level", tag: "Reorder", tone: "warn" },
  { title: "Open shift - Sunday night", detail: "1 carer needed, 11:00pm–7:00am", tag: "Roster gap", tone: "warn" },
  { title: "Fall reported - Harry Fitzgerald", detail: "INC-0432 · logged 8:20am, under review", tag: "Incident", tone: "amber" },
  { title: "Peggy Whitcombe - GP review due", detail: "Room 12 · medication review with Dr Anaru", tag: "Clinical", tone: "accent" },
];

// ---- staff-specific ----
const staffAlerts: Alert[] = [
  { title: "Peggy Whitcombe - 9am medication", detail: "Room 12 · due now, with breakfast", tag: "Now", tone: "warn" },
  { title: "Harry Fitzgerald - post-fall obs", detail: "Room 07 · hourly observations, next at 10am", tag: "Obs", tone: "amber" },
  { title: "Joan Ferris - care note pending", detail: "Room 15 · morning wellbeing note not logged", tag: "Note", tone: "accent" },
];

export function getDashboard(role: PortalRole): Dashboard {
  const isAdmin = role === "admin";
  return {
    greeting: isAdmin ? "Good morning, Sarah" : "Kia ora, Aroha",
    sub: isAdmin
      ? "Here’s how the home is running today."
      : "Here’s what needs you on shift today.",
    alerts: isAdmin ? adminAlerts : staffAlerts,
  };
}
