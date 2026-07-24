# 03 · Data Model

All screen content comes from `src/lib/mock-data/`. Types in `src/types/domain.ts`. Shapes mirror future Supabase rows so the DB swap touches only this layer. Source data: `.design-src/victoria-all-screens.html` lines 1096–1421.

## Conventions

- One file per entity: `residents.ts`, `rooms.ts`, `staff-shifts.ts`, `meals.ts`, `activities.ts`, `incidents.ts`, `family.ts`, `dashboard.ts`, `marketing-content.ts`, `photos.ts`. (Stock is Supabase-backed - see "Stock, providers & ordering" below; `stock-catalog.ts` remains only as its DB seed source.)
- Each exports typed data + accessors: `getResidents()`, `getResidentBySlug(slug)`, `getRooms()`, `getRoomByNum(num)`, etc.
- **Presentation values are derived, not stored** - care-tier colors, severity tints, stock status, initials, occupancy % come from pure helpers (`lib/utils.ts` / accessor layer), keyed off the semantic scales in [01-design-system.md](./01-design-system.md). Raw data stores only the domain fact (e.g. `status: 'Occupied'`), not its hex.

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

`getDashboard(role)` returns `{ greeting, sub, kpis, alerts, todaySchedule, wings, familyPosts, birthdays }`. Admin vs staff differ in greeting/sub/kpis/alerts (lines 1124–1148). Static values - no computation of "today".

## Marketing content

`marketing-content.ts`: `careLevels` (3 room styles + points), `features` (6), `dayTimeline` (4), `facilities` (6), `careWings` (3), `roles` (4 open roles), `benefits` (3), `testimonial`, `stats` (54 suites / 1:5 ratio / 27 yrs), contact details (09 630 1998 · 227 Mt Eden Rd · hello@wesleymteden.nz). Source lines 1413–1421 + marketing sections 30–470.

## Derivations (helpers)

- `careTier(wing)` → Normal/Premium/VIP (`{ Rātā:Normal, Kōwhai:Premium, Tōtara:VIP }`).
- `stockStatus(qty, par)` → In stock / Low / Reorder (ratio ≥1 / ≥0.5 / <0.5) + pct.
- `careTierMeta`, `severityMeta`, `roomStatusMeta`, `activityCatMeta` → `{ colorToken, tintToken }` per semantic scale.
- `slugify(name)`, `initials(name)`.

## Users, roles & permissions - RBAC (`lib/mock-data/users.ts`)

Backs the **Users & access** screen. Types in `types/domain.ts`: `User`, `UserRole`, `UserStatus`, `AppModule`, `ModuleKey`, `Permission`, `PermissionMatrix`.

```ts
type UserRole = "super_admin" | "admin" | "nurse" | "carer" | "activities" | "family" | "stock_manager";
type UserStatus = "Active" | "Invited" | "Suspended";
interface User { name; username; email; role: UserRole; scope: string; status: UserStatus; last: string; initials; color }

type ModuleKey = "dashboard"|"residents"|"rooms"|"roster"|"meals"|"activities"|"family"|"stock"|"incidents"|"users";
type PermissionAction = "view" | "create" | "edit" | "delete";
type Permission = Record<PermissionAction, boolean>;               // one module's grant
type PermissionMatrix = Record<UserRole, Record<ModuleKey, Permission>>;
```

- 7 roles, 10 modules, 4 actions ⇒ matrix of `7 × 10 × 4` grants. `super_admin` is implicit-all and immutable (never store editable rows for it). `stock_manager` (added `0019_stock_manager_role.sql`) is scoped to `dashboard` view + full `stock` CRUD only.
- Accessors: `getUsers()` (mock, unused by the live screen - kept type-safe only), `getModules()`, `getDefaultPermissions()` (seed matrix), `countGranted()`, `ROLE_KEYS`. Role/status colors derive in `design-meta.ts` (`userRoleMeta`, `userStatusMeta`) - not stored.
- **`scope`** is free-text today (e.g. "Rātā wing", "Peggy W. · Rātā 12"). For the DB, model it as a typed FK (wing or resident) - see below.

### Login: username required, email optional - LIVE (`supabase/migrations/0014_user_username.sql`)

`app_users.username` (citext, unique, not null) is the required login handle; `app_users.email` is now nullable (contact email, also a valid login identifier when set). Supabase Auth still needs an email per `auth.users` row - accounts with no real email get a deterministic synthetic address `<username>@no-email.wesley.internal` (`AUTH_EMAIL_DOMAIN`, `src/lib/validation/username.ts`).

- `src/lib/validation/username.ts` - pure helpers: `normalizeUsername`, `validateUsername` (`^[a-z0-9._-]{3,30}$`, reserved: `admin|root|system|support`), `isValidEmail`, `syntheticAuthEmail`, `resolveAuthEmail(row)` (real email if set, else synthetic).
- `src/lib/supabase/admin.ts` - service-role client (`createAdminClient`), server-only, bypasses RLS. Only imported by the two actions below.
- `src/lib/actions/users.ts` (`createUser`) - admin-only (checked server-side: caller's `role_id` must be `super_admin` or `admin`, via `getCurrentUser()`) account creation: `auth.users` + `app_users` row, rolls back the orphaned auth user if the `app_users` insert fails.
- `src/lib/actions/auth.ts` (`signIn`) - resolves a username-or-email identifier to the account server-side (anonymous users can't read `app_users` under RLS), then signs in via the SSR client. Every failure (no such identifier, wrong password) returns the same generic message to prevent account enumeration; a soft-deleted account (`deleted_at is not null`) is refused the same way.
- `login-view.tsx` takes a single "Username hoặc email" identifier field instead of a dedicated email field.
- **Known limitation:** the Roles & permissions tab remains local React state only, not persisted.

### Users full CRUD - LIVE (`supabase/migrations/0015_app_users_soft_delete.sql`)

`app_users.deleted_at` (nullable timestamptz) is a soft-delete flag: removing an account sets it instead of dropping the row, so it can be recovered. Active-account queries (`listAppUsers`) filter `deleted_at is null`; `listRemovedAppUsers` is the inverse for the "Removed" toggle.

- `src/lib/actions/users.ts` - `updateUser` (rewrites every editable field: name/username/email/password/role/scope/building, syncing `auth.users` via `updateUserById`), `deleteUser` (soft, sets `deleted_at`), `recoverUser` (clears it). All admin-only via the shared `requireAdmin()` guard.
- Role options come from `public.roles` (`src/lib/data/user-roles.ts::listUserRoles`), not the `ROLE_KEYS` mock - source of truth matches what's actually stored in `app_users.role_id`.
- Building options come from `public.buildings` (`src/lib/data/buildings.ts::listBuildings`); Add/Edit user modal lets an admin pick the building, replacing the previous hardcoded `'wesley'`.
- `src/app/portal/users/page.tsx` loads users, removed users, roles, and buildings in parallel and passes them to the `UsersView` client island.

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
Date/week accessors (`roster-schedule.ts`): `getRosterDays()`, `dailyTotals(staffIds, days, grid)`, `totalShifts(grid)`, `rosterWeekTitle(days)`, week helpers. The **shift-type vocabulary is real data** - `getRosterShiftTypes()` (`lib/data/roster.ts`) maps Supabase `shift_templates` into `ShiftType`; there is no hardcoded shift lookup. A cell can hold multiple shift ids. Shift-type colors are stored per template, rendered via inline style.

## Stock, providers & ordering - LIVE (`supabase/migrations/0002_stock_procurement.sql`)

Backs the **Stock** tabs (Inventory / Stock in/out / Place order / Providers). Applied + seeded (`scripts/db/seed-stock.mts`).

```sql
providers(id, building_id, name, category, contact_email, phone, lead_time, terms, preferred, color, tint, created_at)
products(id, building_id, name, category, unit, price, provider_id, par, created_at)
stock_levels(product_id, building_id, qty_now, updated_at)          -- pk (product_id, building_id); on-hand lives HERE, not on products
stock_movements(id, building_id, product_id, direction 'in'|'out', qty, after_qty, unit,
                 provider_id, unit_price, dests jsonb, receiver, note, actor_id, moved_at, move_date)
orders(id, building_id, provider_id, status 'draft'|'placed', placed_by, placed_at, total_excl_gst, created_at)
order_lines(order_id, product_id, qty, unit_price)                  -- pk (order_id, product_id)
```

RLS: `{table}_read` (select, authenticated) / `{table}_write` (all, authenticated) on all six tables.

Two RPCs keep on-hand and the ledger atomic (`security invoker`, RLS applies):
- `record_stock_movement(p_product_id, p_building_id, p_direction, p_qty, p_unit, p_provider_id, p_unit_price, p_dests, p_receiver, p_note, p_actor_id, p_move_date)` → adjusts `stock_levels.qty_now` (clamped ≥0), then inserts the `stock_movements` row.
- `delete_stock_movement(p_id)` → reverses the balance, then deletes the row.

Data layer: `src/lib/data/stock.ts` (`getProviders`, `getProducts`, `getMovements`, `getMovementsForProduct`, `getOrders`) reads; `src/lib/actions/stock.ts` (`saveProduct`, `deleteProduct`, `saveProvider`, `deleteProvider`, `recordMovement`, `deleteMovement`, `placeOrder`, `getItemHistory`) writes - all scoped `building_id = 'wesley'` (constant this phase), each write action `revalidatePath("/portal/stock")`. Orders split the draft cart **by provider** into one `orders` row + `order_lines` per PO. Stock status derives client-side via `stockLevel(qtyNow, par)`.

`lib/mock-data/stock-catalog.ts` (`getProviders()`, `getProductCatalog()`) is retained **only** as the seed source for `scripts/db/seed-stock.mts` - the live screen reads Supabase, not this mock.

## Staff administration - LIVE (`supabase/migrations/0003_staff_admin.sql`)

Backs the **Staff** screen (Team / Shift templates / Leave requests). **Schema defined; DB apply/seed deferred** until the DB is reachable from the build env (same handoff as core/Stock - run the migration, then `npx tsx scripts/db/seed-staff.mts`).

> `staff.preferred_name text` (nullable, optional) — added in `0023_staff_preferred_name.sql`. The name a staffer likes to be called (e.g. "Bob" for "Robert Smith"). Shown in place of `name` on the roster grid, duty-export sheet and `/today` (via `staffDisplayName()` + the `today_on_duty`/`today_on_call` RPCs); the Staff table, sidebar and Users table keep the legal `name`, and avatar initials stay derived from `name`.

```sql
-- extends the existing `staff` table (from 0001_core_schema.sql)
alter table public.staff
  add column contract   text,          -- Full-time | Part-time | Casual
  add column hours       int,          -- weekly hours, derived from contract on save
  add column phone       text,
  add column start_label text,
  add column annual      int not null default 20,   -- annual leave entitlement (days)
  add column taken       int not null default 0;     -- days taken, debited by approve_leave

shift_templates(id text pk, building_id, name, time_label, req int, filled int,
                 color, tint, border, created_at)
leave_requests(id uuid pk default gen_random_uuid(), building_id, staff_id references staff(id),
               type text,              -- Annual leave | Sick leave | Shift swap
               from_date date, to_date date, days int default 1,
               status text default 'Pending',   -- Pending | Approved | Declined
               note text, created_at)
```

RLS: `{table}_read` (select, authenticated) / `{table}_write` (all, authenticated) on `shift_templates` and `leave_requests`.

One RPC keeps approval and the leave balance atomic (`security invoker`, RLS applies):
- `approve_leave(p_id)` → sets the request `status = 'Approved'`; if `type` is Annual/Sick leave, also debits `staff.taken` by the request's `days`. No-op if already approved.

Data layer: `src/lib/data/staff.ts` (`getStaff`, `getShiftTemplates`, `getLeaveRequests`) reads; `src/lib/actions/staff.ts` (`saveStaff`, `deleteStaff`, `saveShiftTemplate`, `deleteShiftTemplate`, `saveLeave`, `approveLeave`, `declineLeave`) writes - all scoped `building_id = 'wesley'` (constant this phase), each write action `revalidatePath("/portal/staff")`. `saveStaff` edits never touch `annual`/`taken` (balance-only mutation path is `approve_leave`).

## Roles & groups - LIVE (`supabase/migrations/0007_role_groups.sql`)

Roles become first-class, admin-managed entities (Staff → **Roles & groups**) instead of free strings assembled from the staff list. Groups band and order the weekly roster.

```sql
role_groups(id text, building_id, label, color, tint, sort_order int,
            primary key (building_id, id))
staff_roles(building_id, name text, color, tint,
            group_id text,              -- null = unassigned
            sort_order int,
            primary key (building_id, name),
            foreign key (building_id, group_id)
              references role_groups(building_id, id) on delete set null)
```

- `staff_roles.name` matches the strings in `staff.roles` (no staff rows rewritten). The migration seeds three ordered groups (**Nurses & HCAs → Care Takers → Kitchen**), auto-registers every role already held by staff (+ base roles), and applies a default role→group mapping - all editable in-app afterward.
- **Roster banding:** each staffer lands in the earliest group (by `sort_order`) that any of their roles maps to; unmapped staff fall into a trailing "Unassigned" band. Pure helper: `src/lib/roster-grouping.ts` `groupStaffForRoster(staff, roles, groups)`.
- RLS: `{table}_read` (select, authenticated) / `{table}_write` (all, authenticated) on both tables.
- Data layer: `src/lib/data/roles.ts` (`getRoleGroups`, `getRoles`) reads; `src/lib/actions/roles.ts` (`saveRole`, `deleteRole`, `assignRoleToGroup`, `saveGroup`, `deleteGroup`, `moveGroup`) writes - each revalidates both `/portal/staff` and `/portal/roster`. `deleteRole` is blocked while any staffer still holds the role.

Types: `StaffRecord`, `ShiftTemplate`, `StaffLeaveRequest` (`src/types/domain.ts`) - distinct from the pre-existing mock-data `StaffMember`/`LeaveRequest` types still used by Roster's read-only leave list (`components/portal/roster/leave-request-row.tsx`), which is unaffected by this screen.

## Forms library - LIVE (`supabase/migrations/0024_form_templates.sql`)

Admin-only blank form-template library (`/portal/forms`), facility-wide. Files in a **private
Storage bucket** `form-templates`; this table holds metadata.

```sql
form_templates(id uuid pk, name text not null,
               category text not null check (category in (…9 fixed values…)),
               description text, file_path text not null, file_name text not null,
               mime_type text, size_bytes bigint,
               uploaded_by uuid references app_users(id) on delete set null,
               created_at, updated_at)
```

- Category enum (9): Admission & discharge, Care plan, Clinical & assessment, Consent, Incident & risk, Medication, HR & staff, Policy & procedure, Other. Source of truth `src/lib/forms-constants.ts` (`FORM_CATEGORIES`) + check constraint.
- Storage bucket `form-templates` (private) + RLS on `storage.objects` (authenticated read/insert/delete scoped to the bucket); admin gating in server actions.
- RLS table: `form_templates_read` (select, authenticated) / `form_templates_write` (all, authenticated).
- Data: `src/lib/data/forms.ts` (`getFormTemplates`, `getFormDownloadUrl` → 60s signed URL). Actions: `src/lib/actions/forms.ts` (`saveFormTemplate`, `deleteFormTemplate`, `formDownloadUrl`), admin-gated.
- Module `forms` in the permission matrix: admin/super_admin ALL, other roles NONE. After apply, re-run `scripts/db/seed-core-schema.mts` to seed `role_permissions`.
- Anchor for a future fillable-forms phase (`form_fields`/`form_submissions` reference `form_templates.id`). See [features/portal/forms-library.md](features/portal/forms-library.md).

## Future Supabase mapping (deferred - not this phase)

> **Status:** the **core subset is LIVE in the DB** - `supabase/migrations/0001_core_schema.sql` (tables `roles`, `role_permissions`, `buildings`, `building_wings`, `app_users`, `staff`, `residents`, all with RLS) applied + seeded from the mocks (`scripts/db/seed-core-schema.mts`, or paste-ready `supabase/seed/0001_core_seed.sql`). Row counts: roles 6, role_permissions 240 (6×10×4), buildings 2, app_users 11, staff 10, residents 9. `app_users` already gates portal access + role (verified end-to-end); `app_users.username` is now required for login, `email` optional - see "Login: username required, email optional" above. **Stock & procurement is also LIVE** - `supabase/migrations/0002_stock_procurement.sql` (tables `providers`, `products`, `stock_levels`, `stock_movements`, `orders`, `order_lines`, all with RLS + two RPCs) applied + seeded; see "Stock, providers & ordering" above. **Staff administration schema is also defined** (`0003_staff_admin.sql`, extended `staff` columns + `shift_templates` + `leave_requests` + `approve_leave` RPC) but DB apply/seed is deferred - see "Staff administration" above. Other screens still read mock data - swapping accessors to Supabase queries is the next step. The remaining tables below are still deferred.

Accessors become async queries; screens unchanged (already `await` accessors where practical). The shapes below keep the mock layer DB-compatible so the swap is mechanical. RLS on every table.

### Care/ops tables (existing screens)
`residents`, `rooms`, `shifts` (+ `shift_staff` join), `incidents`, `meal_services`, `activities`, `family_posts`, `visits`, `messages`, `birthdays`. (Stock's tables are LIVE - see "Stock, providers & ordering" above. `staff`'s extended columns, `shift_templates`, and `leave_requests` are schema-defined - see "Staff administration" above; neither is deferred anymore.)

### RBAC tables (Users & access)
```sql
-- fixed lookup of the 7 roles
roles(id text pk,           -- 'super_admin' | 'admin' | 'nurse' | 'carer' | 'activities' | 'family' | 'stock_manager'
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
**Every care/ops table gains a `building_id` FK** (residents, rooms, staff, roster, stock_levels, incidents…). suites/occupied/staff counts on the Buildings card become aggregate queries per building. The active building (topbar switcher) becomes a query filter and - with auth - an RLS scoping dimension (a user only sees buildings they're assigned to).

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
