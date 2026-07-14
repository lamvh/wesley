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

// ---- users & access (super admin) ----
export type UserRole =
  | "super_admin"
  | "admin"
  | "nurse"
  | "carer"
  | "activities"
  | "family";
export type UserStatus = "Active" | "Invited" | "Suspended";

export interface User {
  name: string;
  email: string;
  role: UserRole;
  scope: string;
  status: UserStatus;
  last: string;
  initials: string;
  color: string;
}

export type ModuleKey =
  | "dashboard"
  | "residents"
  | "rooms"
  | "roster"
  | "meals"
  | "activities"
  | "family"
  | "stock"
  | "incidents"
  | "users";

export interface AppModule {
  key: ModuleKey;
  label: string;
}

export type PermissionAction = "view" | "create" | "edit" | "delete";
export type Permission = Record<PermissionAction, boolean>;
export type ModulePermissions = Record<ModuleKey, Permission>;
export type PermissionMatrix = Record<UserRole, ModulePermissions>;

// ---- meal report (daily intake) ----
export type IntakeLevel = "all" | "most" | "some" | "refused";

export interface MealReportResident {
  idx: number;
  name: string;
  room: string;
  initials: string;
  color: string;
  diet: string;
}

/** log[residentIdx][meal] = intake level (or absent when not yet logged) */
export type MealLog = Record<number, Partial<Record<"breakfast" | "lunch" | "dinner", IntakeLevel>>>;

// ---- buildings (multi-site) ----
export interface Building {
  id: string;
  name: string;
  full: string;
  suburb: string;
  wings: string[];
  suites: number;
  occupied: number;
  staff: number;
  mgr: string;
  color: string;
  tint: string;
  initials: string;
}

// ---- roster scheduler ----
export interface ShiftType {
  id: string;
  code: string;
  label: string;
  time: string;
  color: string;
  tint: string;
  border: string;
}

export interface RosterStaff {
  name: string;
  pos: string;
  initials: string;
  color: string;
}

export interface RosterDay {
  dow: string;
  date: string;
}

/** grid["{rowIdx}-{colIdx}"] = list of shift-type ids for that staff/day cell */
export type RosterGrid = Record<string, string[]>;

// ---- stock: providers, catalog, ordering ----
export interface Provider {
  id: string;
  name: string;
  cat: string;
  contact: string;
  phone: string;
  lead: string;
  terms: string;
  pref: boolean;
  color: string;
  tint: string;
}

export interface Product {
  id: string;
  name: string;
  cat: string;
  unit: string;
  price: number;
  prov: string;
  par: number;
  qtyNow: number;
}

/** cart[productId] = quantity */
export type Cart = Record<string, number>;

export type MovementDir = "in" | "out";

export interface MovementDest { room: string; person: string; qty: number; }

export interface StockMovement {
  id: string;
  productId: string;
  item: string;          // product name (denormalised for display)
  unit: string;
  dir: MovementDir;
  qty: number;
  afterQty: number;      // on-hand balance after this move
  providerId?: string;   // in only
  unitPrice?: number;    // in only
  dests?: MovementDest[]; // out only
  receiver?: string;     // out only
  note?: string;
  by: string;            // actor name
  date: string;          // ISO move_date
}

export interface OrderLine { productId: string; name: string; qty: number; unitPrice: number; }
export interface Order {
  id: string;
  providerId: string;
  status: "draft" | "placed";
  placedAt?: string;
  totalExclGst: number;
  lines: OrderLine[];
}

// ---- staff administration ----
export interface StaffRecord {
  id: string; name: string; role: string; wing: string;
  contract: string; hours: number; phone: string; start: string;
  status: string; initials: string; color: string;
  annual: number; taken: number;
}
export interface ShiftTemplate {
  id: string; name: string; time: string; req: number; filled: number;
  color: string; tint: string; border: string;
}
export interface StaffLeaveRequest {
  id: string; staffId: string; name: string; initials: string; color: string;
  type: string; from: string; to: string; days: number; status: string; note: string;
}
