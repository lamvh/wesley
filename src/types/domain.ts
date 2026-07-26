// Domain model for Victoria at Mt Eden. Mock-data shapes mirror future
// Supabase rows (see docs/03-data-model.md). Presentation values (colors)
// are NOT stored here - derived in lib/design-meta.ts.

/** Room tier, now stored per room rather than derived from a wing name. */
export type CareTier = "Normal" | "Premium" | "VIP";

/** Per-record avatar/person color (data-driven, rendered via PersonBadge). */
export type PersonColor = string;

export interface Resident {
  slug: string;
  name: string;
  pref: string;
  /** which home they live in - `buildings.id` ("wesley" | "lodge"). Room
   *  numbers repeat across buildings (both have a 3A), so anything that
   *  matches a resident to a room must key on this too. */
  buildingId: string;
  /** Location in the facility - a room number from the real register
   *  (Supabase `rooms`, see lib/data/rooms.ts). "" when not yet placed. */
  room: string;
  age: number;
  diet: string;
  mobility: string;
  gp: string;
  avatar: string;
  color: PersonColor;
  note: string;
  flags: string[];
  /** date of birth, ISO YYYY-MM-DD; "" if unrecorded. `age` stays the stored
   *  figure - it is not derived from this. */
  dob: string;
  /** date of admission, ISO YYYY-MM-DD; "" if unrecorded. */
  admittedOn: string;
  /** NZ National Health Index number (3 letters + 4 chars); "" if unrecorded. */
  nhi: string;
  gender: string;
  /** the care/activity group this resident belongs to; "" if unassigned. */
  group: string;
  phone: string;
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
  status: RoomStatus;
  /** "" when the home hasn't assigned this room a tier yet. */
  tier: CareTier | "";
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
  familyPosts: { from: string; resident: string; initials: string; color: PersonColor; preview: string; time: string }[];
}

// ---- marketing ----
export interface RoomStyle {
  name: string;
  /** small label above the name, e.g. "Rest home care". */
  eyebrow: string;
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
  | "family"
  | "stock_manager";
export type UserStatus = "Active" | "Invited" | "Suspended";

export interface User {
  name: string;
  username: string;
  email: string;
  role: UserRole;
  scope: string;
  buildingId: string;
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
  | "forms"
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
  /** registry role this shift is for; "" if unrestricted. The roster cell
   *  picker only offers a shift to staff sharing this role's group. */
  role: string;
  /** how many people this shift needs per day (shift_templates.req). Summed
   *  per role group to give the roster's per-band daily requirement. */
  req: number;
  /** building id the shift belongs to ("wesley" | "lodge"); splits the duty
   *  sheet into per-building columns. */
  building: string;
}

export interface RosterDay {
  dow: string;
  date: string;
  month: string;
  iso: string; // YYYY-MM-DD - the calendar date this column represents
}

/** grid["{staffId}::{YYYY-MM-DD}"] = list of shift-type ids for that staff/day cell */
export type RosterGrid = Record<string, string[]>;

/** Composite cell key: keyed by staff id + calendar date so assignments survive
 *  staff reordering (unlike a positional row/col index). */
export const rosterCellKey = (staffId: string, dateISO: string) =>
  `${staffId}::${dateISO}`;

/** How often one staffer has been given one shift over the lookback window. */
export interface ShiftUsage {
  shiftId: string;
  count: number;
}

/** usage["{staffId}"] = that staffer's shifts, most-assigned first. Backs the
 *  "Thường làm" suggestions at the top of the roster cell picker. */
export type ShiftUsageByStaff = Record<string, ShiftUsage[]>;

/** One assignment created by copying the previous week forward. */
export interface RosterCopiedShift {
  staffId: string;
  dateISO: string;
  shiftId: string;
}

/** Outcome of "copy last week": only the assignments that were actually added,
 *  so the caller can merge them into the grid without a refetch. Shifts the week
 *  already had are left untouched and never appear here. */
export interface RosterCopyResult {
  added: RosterCopiedShift[];
  /** Set when nothing was written because of an error or an empty source week. */
  message?: string;
}

// ---- duty roster export (print document) ----
/** Config for the "Export duty roster" flow (modal → print preview). */
export interface DutyForm {
  scope: "day" | "week";
  /** index into the visible week's days when scope is "day". */
  day: number;
}
/** One printed line on a duty sheet: a shift time segment + a staff name. */
export interface DutyRow { time: string; name: string; }
/** A role band on the sheet, its assigned lines split into per-building columns
 *  (Wesley left, The Lodge right) by the building each shift belongs to. */
export interface DutySection { label: string; wesley: DutyRow[]; lodge: DutyRow[]; }
/** One A4 duty sheet (one per day; a whole-week export yields up to seven).
 *  Same shape the public /today board renders, so both share one document. */
export interface DutySheet {
  dateLabel: string;
  /** on-call staff name for this day (grid's per-day on-call row); "" if unset. */
  onCall: string;
  sections: DutySection[];
  /** Kitchen shifts — one band shared across both buildings. */
  kitchen: DutyRow[];
}
/** `<option>` for the duty modal's day / staff selects. */
export interface DutyOption { value: string; label: string; }

// ---- public today-on-duty board (/today) ----
/** One raw row from the today_on_duty RPC. */
export interface TodayDutyRow { buildingId: string; role: string; name: string; time: string; }
/** The whole public board: role bands + a Kitchen band (Lodge column stays empty).
 *  Reuses the duty-export shapes so /today and the export render one document. */
export interface TodayBoardSheet {
  sections: DutySection[];
  kitchen: DutyRow[];
  /** today's on-call staff name (Wesley only - the only building on-call tracks); "" if unset. */
  onCall: string;
}

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
  id: string; name: string; roles: string[];
  contract: string; hours: number; phone: string; start: string;
  status: string; initials: string; color: string;
  /** preferred display name (the name they like to be called); "" if unset.
   *  Shown in place of `name` on the roster grid, duty export and /today. */
  preferredName: string;
  /** annual-leave entitlement in days, and how many of them are used. 0 when
   *  no entitlement has been entered for this person. */
  annual: number; taken: number;
  /** sick-leave entitlement in days, and how many are used. Tracked separately
   *  from annual so sick days don't eat the annual allowance. */
  sick: number; sickTaken: number;
  /** work-visa type (e.g. "Work Visa"); "" if unset. */
  visaType: string;
  /** ISO date (YYYY-MM-DD) the visa expires; "" for citizens/PR or unset. */
  visaExpiry: string;
  /** roster band override for staff whose roles span >1 group; null = auto
   *  (earliest eligible group). Ignored when the roles map to a single group. */
  rosterGroupId: string | null;
}
export interface ShiftTemplate {
  id: string; name: string; time: string; req: number; filled: number;
  color: string; tint: string; border: string;
  /** registry role name this shift is for; "" if unset. Constrains the roster
   *  picker (only staff sharing the role's group are offered the shift). */
  role: string;
  /** paid hours per shift, fed into wage calculations; 0 if unset. */
  paidHours: number;
  /** building id the template belongs to (groups the Shift-templates tab). */
  building: string;
}
// A role in the registry (Staff → Roles & groups). `name` is the label held in
// StaffRecord.roles; `groupId` is the group it bands into on the roster (null =
// unassigned).
export interface RoleDef {
  name: string; color: string; tint: string; groupId: string | null;
  /** order within the role's group (ascending); sequences the group's role
   *  chips and staff within the matching roster band. */
  sortOrder: number;
  /** hourly pay rate (NZD) for this role; drives the Payroll tab. 0 if unset. */
  hourlyRate: number;
}
// An ordered roster band. `sortOrder` sequences the bands top-to-bottom on the
// weekly roster and in the Roles & groups tab.
export interface RoleGroup {
  id: string; label: string; color: string; tint: string; sortOrder: number;
}
export interface StaffLeaveRequest {
  id: string; staffId: string; name: string; initials: string; color: string;
  type: string; from: string; to: string; days: number; status: string; note: string;
}
