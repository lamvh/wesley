import type {
  Alert,
  Dashboard,
  Kpi,
  OccupancyWing,
  PortalRole,
  ScheduleItem,
} from "@/types/domain";
import { getBirthdays } from "./activities";

// ---- shared across roles ----
const todaySchedule: ScheduleItem[] = [
  { time: "9:30", title: "Garden group", where: "Courtyard · with Pip" },
  { time: "10:30", title: "Morning tea & scones", where: "Main lounge" },
  { time: "11:00", title: "Gentle exercise", where: "Rātā lounge · with physio" },
  { time: "2:00", title: "Choir & singalong", where: "Chapel · with Grace" },
  { time: "2:30", title: "Birthday afternoon tea", where: "Kōwhai lounge · Mei’s 90th" },
  { time: "3:30", title: "Afternoon quiz", where: "Kōwhai lounge" },
];

const wings: OccupancyWing[] = [
  { name: "Rātā · Normal", filled: 22, total: 24, tone: "sage" },
  { name: "Kōwhai · Premium", filled: 17, total: 18, tone: "navy" },
  { name: "Tōtara · VIP", filled: 12, total: 12, tone: "gold" },
];

const familyPosts: Dashboard["familyPosts"] = [
  { from: "Aroha (RN)", resident: "Peggy W.", initials: "PW", color: "#6E875E", preview: "Picked the first sweet peas this morning — thrilled!", time: "2h" },
  { from: "Grace (activities)", resident: "George A.", initials: "GA", color: "#b06a5a", preview: "Joined the choir today and sang every song.", time: "4h" },
  { from: "Mere (carer)", resident: "Bill T.", initials: "WT", color: "#5b8f9a", preview: "Enjoyed the cricket on the big screen with Miso.", time: "5h" },
];

// ---- admin-specific ----
const adminKpis: Kpi[] = [
  { label: "Occupancy", value: "94%", delta: "+2%", deltaTone: "accent", sub: "51 of 54 suites" },
  { label: "Staff on shift", value: "12", delta: "Full", deltaTone: "accent", sub: "3 RNs · 9 carers" },
  { label: "Low stock alerts", value: "5", delta: "2 urgent", deltaTone: "warn", sub: "Across 3 categories" },
  { label: "Open incidents", value: "3", delta: "1 new", deltaTone: "warn", sub: "None high severity" },
];

const adminAlerts: Alert[] = [
  { title: "Nitrile gloves (M) below par", detail: "Clinical · 4 boxes left of 20 par level", tag: "Reorder", tone: "warn" },
  { title: "Open shift — Sunday night", detail: "Kōwhai wing needs 1 carer, 11:00pm–7:00am", tag: "Roster gap", tone: "warn" },
  { title: "Fall reported — Harry Fitzgerald", detail: "INC-0432 · logged 8:20am, under review", tag: "Incident", tone: "amber" },
  { title: "Peggy Whitcombe — GP review due", detail: "Rātā 12 · medication review with Dr Anaru", tag: "Clinical", tone: "accent" },
];

// ---- staff-specific ----
const staffKpis: Kpi[] = [
  { label: "My residents", value: "14", delta: "Rātā", deltaTone: "accent", sub: "Rooms 05–18" },
  { label: "Tasks due", value: "6", delta: "2 now", deltaTone: "warn", sub: "Meds, obs, care notes" },
  { label: "Shift ends", value: "3:00", delta: "4h left", deltaTone: "accent", sub: "Afternoon handover" },
  { label: "Activities", value: "3", delta: "Today", deltaTone: "accent", sub: "Garden, choir, quiz" },
];

const staffAlerts: Alert[] = [
  { title: "Peggy Whitcombe — 9am medication", detail: "Rātā 12 · due now, with breakfast", tag: "Now", tone: "warn" },
  { title: "Harry Fitzgerald — post-fall obs", detail: "Rātā 07 · hourly observations, next at 10am", tag: "Obs", tone: "amber" },
  { title: "Joan Ferris — care note pending", detail: "Rātā 15 · morning wellbeing note not logged", tag: "Note", tone: "accent" },
];

export function getDashboard(role: PortalRole): Dashboard {
  const isAdmin = role === "admin";
  return {
    greeting: isAdmin ? "Good morning, Sarah" : "Kia ora, Aroha",
    sub: isAdmin
      ? "Here’s how the home is running today across all three wings."
      : "You’re on the Rātā (Normal) morning shift — here’s what needs you.",
    kpis: isAdmin ? adminKpis : staffKpis,
    alerts: isAdmin ? adminAlerts : staffAlerts,
    todaySchedule,
    wings,
    familyPosts,
    birthdays: getBirthdays(),
  };
}
