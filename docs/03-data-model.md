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

## Users, roles & permissions — RBAC (`lib/mock-data/users.ts`)

Backs the **Users & access** screen. Types in `types/domain.ts`: `User`, `UserRole`, `UserStatus`, `AppModule`, `ModuleKey`, `Permission`, `PermissionMatrix`.

```ts
type UserRole = "super_admin" | "admin" | "nurse" | "carer" | "activities" | "family";
type UserStatus = "Active" | "Invited" | "Suspended";
interface User { name; email; role: UserRole; scope: string; status: UserStatus; last: string; initials; color }

type ModuleKey = "dashboard"|"residents"|"rooms"|"roster"|"meals"|"activities"|"family"|"stock"|"incidents"|"users";
type PermissionAction = "view" | "create" | "edit" | "delete";
type Permission = Record<PermissionAction, boolean>;               // one module's grant
type PermissionMatrix = Record<UserRole, Record<ModuleKey, Permission>>;
```

- 6 roles, 10 modules, 4 actions ⇒ matrix of `6 × 10 × 4` grants. `super_admin` is implicit-all and immutable (never store editable rows for it).
- Accessors: `getUsers()`, `getModules()`, `getDefaultPermissions()` (seed matrix), `countGranted()`, `ROLE_KEYS`. Role/status colors derive in `design-meta.ts` (`userRoleMeta`, `userStatusMeta`) — not stored.
- **`scope`** is free-text today (e.g. "Rātā wing", "Peggy W. · Rātā 12"). For the DB, model it as a typed FK (wing or resident) — see below.

## Meal intake logs (`lib/mock-data/meal-report.ts`)

Backs the **Meal report** screen. `MealLog[residentIdx][slot] = IntakeLevel`.

```ts
type IntakeLevel = "all" | "most" | "some" | "refused";
type MealSlot = "breakfast" | "lunch" | "dinner";
type MealLog = Record<number, Partial<Record<MealSlot, IntakeLevel>>>;
```

- One logical record per **(resident, service_date, meal_slot)**. `summariseMealLog()` aggregates → the 4 KPI tiles.

## Buildings / multi-site (`lib/mock-data/buildings.ts`)

Backs the **Buildings** screen + topbar switcher. The active building is client state (`BuildingProvider` / `useBuilding`).

```ts
interface Building { id; name; full; suburb; wings: string[]; suites; occupied; staff; mgr; color; tint; initials }
```
Accessors: `getBuildings()`, `getBuildingById(id)`, `occupancyPct(b)`. Two sites seeded (Wesley, The Lodge). `wings/suites/occupied/staff` are denormalised counts here; in the DB they become derived aggregates per `building_id`.

## Roster scheduling (`lib/mock-data/roster-schedule.ts`)

Backs the redesigned **Roster** weekly grid.

```ts
interface ShiftType { id; code; label; time; color; tint; border }   // 7 types: ms,m,e,a,n,tld,tll
interface RosterStaff { name; pos; initials; color }
interface RosterDay { dow; date }
type RosterGrid = Record<string, string[]>;   // grid["{rowIdx}-{colIdx}"] = shiftId[]
```
Accessors: `getShiftDefs()`, `getShiftLegend()`, `getRosterStaff()`, `getRosterDays()`, `getDefaultRosterGrid()`, `dailyTotals(staffCount, days, grid)`, `totalShifts(grid)`, `SHIFT_ORDER`, `ROSTER_WEEK_TITLE`. A cell can hold multiple shift ids (e.g. TL day+late). Shift-type colors are stored (they're a fixed lookup, rendered via inline style).

## Stock, providers & ordering (`lib/mock-data/stock-catalog.ts`)

Backs the redesigned **Stock** tabs (Inventory / Place order / Providers).

```ts
interface Provider { id; name; cat; contact; phone; lead; terms; pref; color; tint }
interface Product  { id; name; cat; unit; price; prov; par; qtyNow }   // prov = provider id
type Cart = Record<string, number>;   // { productId: qty }
```
Accessors: `getProviders()`, `getProductCatalog()`, `providerName(id)`, `suggestReorderCart()` (fills below-par up to par). Cart/order state is client-only; orders group **by provider** into separate POs. Stock status derives via `stockLevel(qtyNow, par)`.

## Future Supabase mapping (deferred — not this phase)

> **Status:** the **core subset** is now authored as a migration — `supabase/migrations/0001_core_schema.sql` (tables `roles`, `role_permissions`, `buildings`, `building_wings`, `app_users`, `staff`, `residents`, all with RLS) + a seed from the mocks (`scripts/db/seed-core-schema.mts`, or paste-ready `supabase/seed/0001_core_seed.sql`). Screens still read mock data; swapping accessors to Supabase queries is the next step. The remaining tables below are still deferred.

Accessors become async queries; screens unchanged (already `await` accessors where practical). The shapes below keep the mock layer DB-compatible so the swap is mechanical. RLS on every table.

### Care/ops tables (existing screens)
`residents`, `rooms`, `staff`, `shifts` (+ `shift_staff` join), `leave_requests`, `stock_items`, `incidents`, `meal_services`, `activities`, `family_posts`, `visits`, `messages`, `birthdays`.

### RBAC tables (Users & access)
```sql
-- fixed lookup of the 6 roles
roles(id text pk,           -- 'super_admin' | 'admin' | 'nurse' | 'carer' | 'activities' | 'family'
      label text, description text, is_system bool default false)

users(id uuid pk default gen_random_uuid(),
      auth_id uuid unique references auth.users(id),   -- Supabase Auth link
      name text not null, email citext unique not null,
      role_id text not null references roles(id),
      status text not null default 'Invited',          -- Active | Invited | Suspended
      last_active_at timestamptz,
      created_at timestamptz default now())

-- scope: what a non-global user is limited to (wing OR a single resident for family)
user_scopes(user_id uuid references users(id) on delete cascade,
            wing text null, resident_id uuid null references residents(id),
            primary key (user_id, coalesce(wing,''), coalesce(resident_id,'0')))

-- editable grant matrix; super_admin is NOT stored (implicit allow-all)
role_permissions(role_id text references roles(id) on delete cascade,
                 module text not null,     -- ModuleKey
                 action text not null,      -- view|create|edit|delete
                 granted bool not null default false,
                 primary key (role_id, module, action))
```
Authorization = source of truth server-side: RLS policies + route guards read `role_permissions`, NOT the client matrix. The UI matrix mirrors it. `togglePerm` → `upsert role_permissions`. Add user → `insert users(status='Invited')` + Supabase invite email.

### Buildings / multi-site
```sql
buildings(id text pk,                 -- 'wesley' | 'lodge'
          name text, full_name text, suburb text,
          manager_user_id uuid references users(id),
          color text, created_at timestamptz default now())
building_wings(building_id text references buildings(id), name text,
               primary key (building_id, name))
```
**Every care/ops table gains a `building_id` FK** (residents, rooms, staff, roster, stock_levels, incidents…). suites/occupied/staff counts on the Buildings card become aggregate queries per building. The active building (topbar switcher) becomes a query filter and — with auth — an RLS scoping dimension (a user only sees buildings they're assigned to).

### Roster scheduling
```sql
shift_types(id text pk,               -- ms|m|e|a|n|tld|tll
            code text, label text, time_label text,
            color text, tint text, border text)
roster_assignments(id uuid pk default gen_random_uuid(),
                   building_id text references buildings(id),
                   staff_id uuid references staff(id),
                   work_date date not null,
                   shift_type_id text references shift_types(id),
                   published_at timestamptz,          -- null = draft
                   unique (building_id, staff_id, work_date, shift_type_id))
```
Grid cell `grid["{r}-{c}"]` = the set of `roster_assignments` for that (staff, date). `toggleShift` → insert/delete one row. "Staff on duty" totals + "shifts assigned" → aggregates. Publish sets `published_at` for the week.

### Stock, providers & ordering
```sql
providers(id text pk, name text, category text,
          contact_email citext, phone text, lead_time text, terms text,
          preferred bool default false, color text, created_at timestamptz default now())
products(id text pk, name text, category text, unit text,
         price numeric(10,2), provider_id text references providers(id), par int)
stock_levels(product_id text references products(id),
             building_id text references buildings(id),
             qty_now int not null default 0,
             primary key (product_id, building_id))
orders(id uuid pk default gen_random_uuid(),
       building_id text references buildings(id),
       provider_id text references providers(id),     -- one PO per provider
       status text default 'draft', placed_by uuid references users(id),
       placed_at timestamptz, total_excl_gst numeric(12,2))
order_lines(order_id uuid references orders(id) on delete cascade,
            product_id text references products(id), qty int, unit_price numeric(10,2),
            primary key (order_id, product_id))

-- Action log for stock management (backs the Stock → Activity tab).
-- A scoped slice of the deferred generic audit log.
stock_activity_logs(id uuid pk default gen_random_uuid(),
                    building_id text references buildings(id),
                    kind text not null,          -- order_placed|reorder_autofill|cart_cleared|stock_adjusted
                    summary text not null,        -- "Placed order · MedSupply NZ"
                    detail text,                  -- "5 items · $286.50"
                    actor_id uuid references users(id),
                    order_id uuid null references orders(id),   -- when kind=order_placed
                    product_id text null references products(id), -- when kind=stock_adjusted
                    created_at timestamptz default now())
```
The client `logActions()` (StockView) appends one row per material action; on Place order it writes one `order_placed` row per provider PO. Summary tiles/audit views read `stock_activity_logs` ordered by `created_at desc`.
Client cart (`{productId: qty}`) → on Place order, split by `products.provider_id` into one `orders` row per provider + `order_lines`. Inventory status = `stock_levels.qty_now` vs `products.par` (the `stockLevel` helper). `suggestReorderCart` = "top every below-par product up to par".

### Meal intake logs (Meal report)
```sql
meal_intake_logs(id uuid pk default gen_random_uuid(),
                 resident_id uuid not null references residents(id),
                 service_date date not null,
                 meal_slot text not null,        -- breakfast|lunch|dinner
                 intake_level text null,          -- all|most|some|refused (null = not logged)
                 note text,
                 logged_by uuid references users(id),
                 logged_at timestamptz default now(),
                 unique (resident_id, service_date, meal_slot))
```
Client `setIntake` → `upsert` on the unique key. Summary tiles → `select count(*) filter (...)` grouped by `intake_level`. A "poor intake / refused" row can trigger an `incidents`/alert workflow later.

### Auth ↔ role
Supabase Auth user → `users.auth_id`; `users.role_id` drives both nav visibility (client) and data access (RLS). Role toggle (admin/staff) in the topbar is a **demo device** this phase; with real auth it is replaced by the signed-in user's role.
