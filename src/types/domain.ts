// Domain model for Victoria at Mt Eden. Mock-data shapes mirror future
// Supabase rows (see docs/03-data-model.md). Presentation values (colors)
// are NOT stored here — derived in lib/design-meta.ts.

export type Wing = "Rātā" | "Kōwhai" | "Tōtara";
export type CareTier = "Normal" | "Premium" | "VIP";
export type CareType = "Rest Home" | "Hospital" | "Dementia" | "Respite";

/** Per-record avatar/person color (data-driven, rendered via PersonBadge). */
export type PersonColor = string;

export interface Resident {
  slug: string;
  name: string;
  pref: string;
  room: string;
  wing: Wing;
  careType: CareType;
  age: number;
  diet: string;
  mobility: string;
  gp: string;
  avatar: string;
  color: PersonColor;
  note: string;
  flags: string[];
}

export type RoomStatus = "Occupied" | "Available" | "Maintenance" | "Respite";

export interface RoomResident {
  name: string;
  initials: string;
  color: PersonColor;
  diet: string;
  mobility: string;
}

export interface SupplyItem {
  name: string;
  qty: number;
  par: number;
  unit: string;
}

export interface Room {
  num: string;
  wing: Wing;
  status: RoomStatus;
  careType: CareType;
  resident?: RoomResident;
  note: string;
  house: string;
  supplies: SupplyItem[];
  activities: string[];
}

export type StaffRole = "RN" | "Carer" | "Activities";

export interface StaffMember {
  name: string;
  role: StaffRole;
  wing: Wing | "All";
  initials: string;
  color: PersonColor;
}

export type ShiftName = "Morning" | "Afternoon" | "Night";

export interface Shift {
  name: ShiftName;
  time: string;
  status: string;
  full: boolean;
  gap: string | null;
  staff: StaffMember[];
}

export interface LeaveRequest {
  name: string;
  type: string;
  dates: string;
  initials: string;
  color: PersonColor;
}

export interface StockGroup {
  category: string;
  items: SupplyItem[];
}

export type Severity = "Low" | "Moderate" | "High";
export type IncidentStatus = "Under review" | "Resolved" | "Actioned" | "New";

export interface Incident {
  id: string;
  date: string;
  resident: string;
  type: string;
  severity: Severity;
  status: IncidentStatus;
  reportedBy: string;
}

export interface MealService {
  meal: "Breakfast" | "Lunch" | "Dinner";
  time: string;
  items: { name: string; note: string }[];
}

export interface DietCount {
  label: string;
  count: number;
}

export type ActivityCategory =
  | "garden"
  | "music"
  | "move"
  | "social"
  | "craft"
  | "care"
  | "faith";

export interface Activity {
  time: string;
  title: string;
  where: string;
  category: ActivityCategory;
}

export interface ActivityDay {
  dow: string;
  date: string;
  isToday: boolean;
  items: Activity[];
}

export interface FamilyPost {
  resident: string;
  by: string;
  time: string;
  tag: string;
  initials: string;
  color: PersonColor;
  text: string;
  photoSlot?: string;
}

export interface Visit {
  mon: string;
  day: string;
  who: string;
  detail: string;
}

export interface Message {
  from: string;
  time: string;
  text: string;
}

export type DeltaTone = "accent" | "warn";

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
  sub: string;
  /** optional value color for stock/room/compliance KPIs */
  valueTone?: "ink" | "amber" | "terracotta" | "navy" | "gold" | "available" | "rust";
}

export interface Birthday {
  name: string;
  room: string;
  date: string;
  initials: string;
  color: PersonColor;
  badge: string;
}

export type AlertTone = "warn" | "amber" | "accent";

export interface Alert {
  title: string;
  detail: string;
  tag: string;
  tone: AlertTone;
}

export interface OccupancyWing {
  name: string;
  filled: number;
  total: number;
  tone: "sage" | "navy" | "gold";
}

export interface ScheduleItem {
  time: string;
  title: string;
  where: string;
}

export type PortalRole = "admin" | "staff";

export interface Dashboard {
  greeting: string;
  sub: string;
  kpis: Kpi[];
  alerts: Alert[];
  todaySchedule: ScheduleItem[];
  wings: OccupancyWing[];
  familyPosts: { from: string; resident: string; initials: string; color: PersonColor; preview: string; time: string }[];
  birthdays: Birthday[];
}

// ---- marketing ----
export interface RoomStyle {
  name: string;
  wing: string;
  slot: string;
  desc: string;
  points: string[];
}

export interface Feature {
  title: string;
  desc: string;
  icon: string;
}

export interface TimelineStep {
  time: string;
  title: string;
  desc: string;
}

export interface Facility {
  title: string;
  desc: string;
}

export interface CareWing {
  name: string;
  care: string;
  desc: string;
}

export interface JobRole {
  title: string;
  type: string;
  desc: string;
}

export interface Benefit {
  title: string;
  desc: string;
}

export interface ContactInfo {
  phone: string;
  address: string;
  suburb: string;
  email: string;
  hours: string;
}
