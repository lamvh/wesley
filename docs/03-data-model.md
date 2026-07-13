# 03 · Data Model

All screen content comes from `src/lib/mock-data/`. Types in `src/types/domain.ts`. Shapes mirror future Supabase rows so the DB swap touches only this layer. Source data: `.design-src/victoria-all-screens.html` lines 1096–1421.

## Conventions

- One file per entity: `residents.ts`, `rooms.ts`, `staff-shifts.ts`, `meals.ts`, `activities.ts`, `stock.ts`, `incidents.ts`, `family.ts`, `dashboard.ts`, `marketing-content.ts`, `photos.ts`.
- Each exports typed data + accessors: `getResidents()`, `getResidentBySlug(slug)`, `getRooms()`, `getRoomByNum(num)`, etc.
- **Presentation values are derived, not stored** — care-tier colors, severity tints, stock status, initials, occupancy % come from pure helpers (`lib/utils.ts` / accessor layer), keyed off the semantic scales in [01-design-system.md](./01-design-system.md). Raw data stores only the domain fact (e.g. `status: 'Occupied'`), not its hex.

## Core entities

```ts
type Wing = 'Rātā' | 'Kōwhai' | 'Tōtara';        // Normal | Premium | VIP
type CareTier = 'Normal' | 'Premium' | 'VIP';     // derived from wing (wingTier map)
type CareType = 'Rest Home' | 'Hospital' | 'Dementia' | 'Respite';

interface Resident {
  slug: string;            // slugify(name), route param
  name: string; pref: string;
  room: string; wing: Wing; careType: CareType;
  age: number; diet: string; mobility: string; gp: string;
  avatar: string;          // initials
  colorKey: string;        // avatar palette entry
  note: string;
  flags?: string[];        // e.g. Falls watch, Diabetic, Hearing aid (detail screen)
}

type RoomStatus = 'Occupied' | 'Available' | 'Maintenance' | 'Respite';
interface Room {
  num: string; wing: Wing; status: RoomStatus; careType: CareType;
  resident?: { name: string; initials: string; colorKey: string; diet: string; mobility: string };
  note: string; house: string;               // housekeeping line
  supplies?: SupplyItem[];                    // occupied only
  activities?: string[];                      // occupied only, by wing
}

interface StaffMember { name: string; role: 'RN' | 'Carer' | 'Activities'; wing: Wing | 'All'; initials: string; colorKey: string; }
interface Shift { name: 'Morning'|'Afternoon'|'Night'; time: string; status: string; staff: StaffMember[]; gap?: string | null; }
interface LeaveRequest { name: string; type: string; dates: string; initials: string; colorKey: string; }

interface SupplyItem { name: string; qty: number; par: number; unit: string; }   // status/pct derived from qty/par
interface StockGroup { category: string; items: SupplyItem[]; }

type Severity = 'Low' | 'Moderate' | 'High';
interface Incident { id: string; date: string; resident: string; type: string; severity: Severity; status: 'Under review'|'Resolved'|'Actioned'|'New'; reportedBy: string; }

interface MealService { meal: 'Breakfast'|'Lunch'|'Dinner'; time: string; items: { name: string; note: string }[]; }
interface DietCount { label: string; count: number; }

type ActivityCategory = 'garden'|'music'|'move'|'social'|'craft'|'care'|'faith';
interface Activity { time: string; title: string; where: string; category: ActivityCategory; }
interface ActivityDay { dow: string; date: string; isToday: boolean; items: Activity[]; }

interface FamilyPost { resident: string; by: string; time: string; tag: string; initials: string; colorKey: string; text: string; photoSlot?: string; }
interface Visit { mon: string; day: string; who: string; detail: string; }
interface Message { from: string; time: string; text: string; }

interface Kpi { label: string; value: string; delta?: string; deltaTone?: 'accent'|'warn'; sub: string; }
interface Birthday { name: string; room: string; date: string; initials: string; colorKey: string; badge: string; }
interface Alert { title: string; detail: string; tag: string; tone: 'warn'|'amber'|'accent'; }
interface OccupancyWing { name: string; filled: number; total: number; colorKey: string; }
```

## Dashboard (role-dependent)

`getDashboard(role)` returns `{ greeting, sub, kpis, alerts, todaySchedule, wings, familyPosts, birthdays }`. Admin vs staff differ in greeting/sub/kpis/alerts (lines 1124–1148). Static values — no computation of "today".

## Marketing content

`marketing-content.ts`: `careLevels` (3 room styles + points), `features` (6), `dayTimeline` (4), `facilities` (6), `careWings` (3), `roles` (4 open roles), `benefits` (3), `testimonial`, `stats` (54 suites / 1:5 ratio / 27 yrs), contact details (09 630 1998 · 227 Mt Eden Rd · hello@wesleymteden.nz). Source lines 1413–1421 + marketing sections 30–470.

## Derivations (helpers)

- `careTier(wing)` → Normal/Premium/VIP (`{ Rātā:Normal, Kōwhai:Premium, Tōtara:VIP }`).
- `stockStatus(qty, par)` → In stock / Low / Reorder (ratio ≥1 / ≥0.5 / <0.5) + pct.
- `careTierMeta`, `severityMeta`, `roomStatusMeta`, `activityCatMeta` → `{ colorToken, tintToken }` per semantic scale.
- `slugify(name)`, `initials(name)`.

## Future Supabase mapping (deferred — not this phase)

Tables (RLS on all): `residents`, `rooms`, `staff`, `shifts` (+ `shift_staff` join), `leave_requests`, `supplies`/`stock_items`, `incidents`, `meal_services`, `activities`, `family_posts`, `visits`, `messages`, `birthdays`. Accessors become async Supabase queries; screens unchanged (already `await` accessors where practical). Auth later maps role → `staff.role` (admin/carer). **Do not build any of this now** — listed only so mock shapes stay compatible.
