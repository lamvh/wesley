import type { Alert, Dashboard, Kpi, PortalRole } from "@/types/domain";

// ---- admin-specific ----
const adminKpis: Kpi[] = [
  { label: "Occupancy", value: "94%", delta: "+2%", deltaTone: "accent", sub: "51 of 54 suites" },
  { label: "Staff on shift", value: "12", delta: "Full", deltaTone: "accent", sub: "3 RNs · 9 carers" },
  { label: "Low stock alerts", value: "5", delta: "2 urgent", deltaTone: "warn", sub: "Across 3 categories" },
  { label: "Open incidents", value: "3", delta: "1 new", deltaTone: "warn", sub: "None high severity" },
];

const adminAlerts: Alert[] = [
  { title: "Nitrile gloves (M) below par", detail: "Clinical · 4 boxes left of 20 par level", tag: "Reorder", tone: "warn" },
  { title: "Open shift - Sunday night", detail: "1 carer needed, 11:00pm–7:00am", tag: "Roster gap", tone: "warn" },
  { title: "Fall reported - Harry Fitzgerald", detail: "INC-0432 · logged 8:20am, under review", tag: "Incident", tone: "amber" },
  { title: "Peggy Whitcombe - GP review due", detail: "Room 12 · medication review with Dr Anaru", tag: "Clinical", tone: "accent" },
];

// ---- staff-specific ----
const staffKpis: Kpi[] = [
  { label: "My residents", value: "14", sub: "Across the home" },
  { label: "Tasks due", value: "6", delta: "2 now", deltaTone: "warn", sub: "Meds, obs, care notes" },
  { label: "Shift ends", value: "3:00", delta: "4h left", deltaTone: "accent", sub: "Afternoon handover" },
  { label: "Activities", value: "3", delta: "Today", deltaTone: "accent", sub: "Garden, choir, quiz" },
];

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
    kpis: isAdmin ? adminKpis : staffKpis,
    alerts: isAdmin ? adminAlerts : staffAlerts,
  };
}
