# Supabase Scalable Schema — Design

**Status:** Approved design (pre-implementation)
**Date:** 2026-07-13
**Scope:** Turn the deferred "Future Supabase mapping" in [`docs/03-data-model.md`](../../03-data-model.md) into a real, scalable Postgres/Supabase schema for the Wesley aged-care portal.
**Supersedes:** the schema sketch at the bottom of `03-data-model.md` (kept for provenance).

## Decisions locked with the product owner

| Decision | Choice |
|---|---|
| Growth axis | **Single org now, SaaS-ready later** — `org_id` seam on every tenant table from day one; going multi-tenant is a data migration, not a rewrite. |
| Deliverable | **Design doc first**; SQL migrations + RLS policies generated in a follow-up phase. |
| Audit/history | **Soft-delete + audit columns** baseline (`created_at/updated_at/created_by/updated_by/deleted_at`). Generic trigger-based `audit_log` deferred (see Open Questions). |
| RLS depth | **Full policy strategy** — tenant isolation, building scope, resident scope, and permission-matrix enforcement all specified. |
| RLS enforcement pattern | **Approach C (hybrid)** — identity (`org_id`, `role_id`, `building_ids`) in JWT claims; fine-grained module/action grants checked live via a `SECURITY DEFINER authorize()` function reading `role_permissions`. |

## 1 · Architecture & conventions

- **Postgres 15 on Supabase**, single database, single shared schema. Tenant isolation is **by row (`org_id`)**, never by schema or database. This is the SaaS-ready seam.
- **`uuid` primary keys everywhere** via `gen_random_uuid()`. The current mock-layer text PKs (`'wesley'`, shift code `'ms'`, product ids) become `uuid` PK **plus** a `slug`/`code` unique column for human-readable routing. Rationale: uuids don't collide across tenants and don't leak row counts.
- **Audit columns on every domain table**:
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()` (maintained by a shared `set_updated_at()` trigger)
  - `created_by uuid references app_users(id)`
  - `updated_by uuid references app_users(id)`
  - `deleted_at timestamptz` (soft delete; `NULL` = live)
- **`org_id uuid not null references organizations(id)`** on every tenant-owned table — the isolation column. Exactly one `organizations` row exists today.
- **Enums vs lookup tables:**
  - Postgres `enum` for **universal, fixed** sets: `intake_level`, `permission_action`, `room_status`, `severity`, `user_status`, `staff_role`, `meal_slot`, `activity_category`, `incident_status`.
  - **Lookup tables** for anything a future tenant would customize: `wings`, `care_types`, `care_tiers`, `shift_types`. ("Rātā/Kōwhai/Tōtara" are Wesley-specific; the next tenant names theirs differently.)
- **Presentation values (colors) stay out of the DB** — derived in `lib/design-meta.ts` — **except** genuine config rows (`shift_types`, `care_tiers`), which store a **semantic color token** (e.g. `sage`, `gold`), never a hex string.
- **Naming:** `snake_case` columns and tables; plural table names; FK columns named `<referenced_singular>_id`.
- **Soft-delete reads:** each table exposes a `<table>_live` view filtering `deleted_at IS NULL`; the app reads views, writes base tables. Deletes are `UPDATE ... SET deleted_at = now()`.

## 2 · Identity & tenancy

```sql
organizations (
  id uuid pk default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  ...audit
)

buildings (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  slug text not null,                       -- 'wesley' | 'lodge'
  name text not null, full_name text, suburb text,
  manager_user_id uuid references app_users(id),
  color_token text,
  ...audit,
  unique (org_id, slug)
)

wings (                                     -- lookup, building-scoped
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  name text not null,                       -- 'Rātā' | 'Kōwhai' | 'Tōtara'
  care_tier_id uuid references care_tiers(id),
  sort int default 0,
  ...audit,
  unique (building_id, name)
)

app_users (                                 -- 1:1 with Supabase auth.users
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  auth_id uuid unique references auth.users(id),
  name text not null,
  email citext unique not null,
  role_id text not null references roles(id),
  status user_status not null default 'invited',
  last_active_at timestamptz,
  ...audit
)

user_building_scopes (                      -- which sites a staff user sees
  user_id uuid references app_users(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade,
  primary key (user_id, building_id)
)

user_resident_scopes (                      -- family → their person(s)
  user_id uuid references app_users(id) on delete cascade,
  resident_id uuid references residents(id) on delete cascade,
  primary key (user_id, resident_id)
)
```

`app_users` is the application profile joined 1:1 to Supabase `auth.users`. Staff scope is a set of **buildings**; family scope is a set of **residents**. This replaces the free-text `scope` string in the mock layer.

## 3 · RBAC (Approach C)

```sql
roles (
  id text pk,                               -- 'super_admin'|'admin'|'nurse'|'carer'|'activities'|'family'
  label text not null, description text,
  is_system bool not null default true
)

role_permissions (                          -- editable grant matrix; org-scoped from day one
  org_id uuid not null references organizations(id),
  role_id text not null references roles(id) on delete cascade,
  module text not null,                     -- ModuleKey
  action permission_action not null,        -- view|create|edit|delete
  granted bool not null default false,
  primary key (org_id, role_id, module, action)
)
-- super_admin is NOT stored (implicit allow-all within its org).
```

**Custom access-token hook** (Supabase Auth) injects into every JWT:
`org_id`, `role_id`, `building_ids[]` — identity that rarely changes, so it is safe to cache in the token.

**Helper functions** (all `SECURITY DEFINER`, `search_path` pinned to `public`):

| Function | Returns | Purpose |
|---|---|---|
| `auth_uid()` | `uuid` | current `app_users.id` for the signed-in auth user |
| `auth_org_id()` | `uuid` | reads `org_id` claim |
| `auth_role()` | `text` | reads `role_id` claim |
| `auth_building_ids()` | `uuid[]` | reads `building_ids` claim |
| `authorize(module text, action permission_action)` | `bool` | reads `role_permissions` live — permission edits take effect immediately; `super_admin` short-circuits to `true` |

Identity in claims (cheap, constant-time) + permissions in a live function (instant edits) is the balance Approach C buys. Because `role_permissions` and the customizable lookups are **org-scoped from day one**, a future tenant can own its matrix without touching the system roles.

## 4 · Care domain

```sql
care_tiers (id uuid pk, org_id, code, label, sort, ...audit)          -- Normal|Premium|VIP
care_types (id uuid pk, org_id, code, label, ...audit)               -- Rest Home|Hospital|Dementia|Respite

residents (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  slug text not null,                       -- slugify(name), route param
  name text not null, pref_name text,
  room_id uuid references rooms(id),
  wing_id uuid references wings(id),
  care_type_id uuid references care_types(id),
  dob date,                                 -- age is DERIVED, never stored
  diet text, mobility text, gp text, note text,
  ...audit,
  unique (org_id, slug)
)

resident_flags (                            -- was string[] on the resident
  id uuid pk default gen_random_uuid(),
  resident_id uuid not null references residents(id) on delete cascade,
  label text not null,                      -- 'Falls watch'|'Diabetic'|'Hearing aid'
  ...audit
)

rooms (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  wing_id uuid references wings(id),
  number text not null,
  status room_status not null default 'available',   -- occupied|available|maintenance|respite
  care_type_id uuid references care_types(id),
  housekeeping_note text, note text,
  ...audit,
  unique (building_id, number)
)

staff (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  app_user_id uuid references app_users(id),  -- null = staff member without a login
  name text not null,
  staff_role staff_role not null,             -- RN|Carer|Activities
  wing_id uuid references wings(id),           -- null = "All"
  ...audit
)
```

**Normalizations vs the mock layer:**
- `age` → **derived** from `dob` (never store a value that goes stale daily).
- resident `flags[]` → `resident_flags` (1:N).
- room ↔ resident is the single FK `residents.room_id`; rooms do **not** duplicate resident fields. The mock layer's embedded `room.resident {...}` was a rendering convenience — in the DB it's a join.

## 5 · Operations

```sql
-- Roster
shift_types (id uuid pk, org_id, code, label, time_label, color_token, sort, ...audit)  -- ms|m|e|a|n|tld|tll
roster_assignments (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  staff_id uuid not null references staff(id),
  work_date date not null,
  shift_type_id uuid not null references shift_types(id),
  published_at timestamptz,                 -- null = draft
  ...audit,
  unique (building_id, staff_id, work_date, shift_type_id)
)
leave_requests (id uuid pk, org_id, staff_id fk, type, start_date, end_date, status, ...audit)

-- Meals
meal_services (id uuid pk, org_id, building_id, meal meal_slot, service_date, time_label, ...audit)
meal_service_items (id uuid pk, meal_service_id fk on delete cascade, name, note, sort)
meal_intake_logs (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  resident_id uuid not null references residents(id),
  service_date date not null,
  meal_slot meal_slot not null,             -- breakfast|lunch|dinner
  intake_level intake_level,                -- all|most|some|refused (null = not logged)
  note text, logged_by uuid references app_users(id), logged_at timestamptz default now(),
  ...audit,
  unique (resident_id, service_date, meal_slot)
)

-- Activities
activities (id uuid pk, org_id, building_id, activity_date, time_label, title, location,
            category activity_category, ...audit)

-- Stock, providers, ordering
providers (id uuid pk, org_id, slug, name, category, contact_email citext, phone,
           lead_time, terms, preferred bool default false, ...audit, unique(org_id,slug))
products  (id uuid pk, org_id, slug, name, category, unit, price numeric(10,2),
           provider_id uuid references providers(id), par int, ...audit, unique(org_id,slug))
stock_levels (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  product_id uuid not null references products(id),
  building_id uuid not null references buildings(id),
  qty_now int not null default 0,
  ...audit,
  unique (product_id, building_id)
)
orders (id uuid pk, org_id, building_id, provider_id fk, status, placed_by fk,
        placed_at, total_excl_gst numeric(12,2), ...audit)       -- one PO per provider
order_lines (order_id uuid references orders(id) on delete cascade,
             product_id uuid references products(id), qty int, unit_price numeric(10,2),
             primary key (order_id, product_id))

-- Compliance
incidents (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  building_id uuid not null references buildings(id),
  resident_id uuid references residents(id),
  incident_date date not null, type text,
  severity severity not null, status incident_status not null default 'new',
  reported_by uuid references app_users(id), description text,
  ...audit
)
```

**Derived, never denormalized:** stock status (In stock/Low/Reorder = `qty_now` vs `par`), occupancy %, the Buildings-card `suites/occupied/staff` counts. These are aggregate queries/views so they cannot drift out of sync. The client cart `{productId: qty}` splits by `products.provider_id` into one `orders` row per provider + `order_lines` on Place Order.

## 6 · Family portal

```sql
family_posts (id uuid pk, org_id, resident_id fk, author_user_id fk, tag, body,
              photo_id uuid references photos(id), posted_at, ...audit)
visits       (id uuid pk, org_id, resident_id fk, visitor_name, detail, visit_at, ...audit)
messages     (id uuid pk, org_id, resident_id fk, from_user_id fk, body, sent_at, ...audit)
photos       (id uuid pk, org_id, resident_id, storage_path, caption, ...audit)  -- Supabase Storage object ref
```

Family users reach only rows for their linked resident(s), enforced by `user_resident_scopes` + RLS (§7 layer 3). Photos reference Supabase Storage objects; Storage buckets get parallel RLS keyed on the same resident scope.

## 7 · RLS strategy (full)

Every tenant table: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; ... FORCE ROW LEVEL SECURITY;`
Policies compose (ANDed) in these layers:

1. **Tenant isolation — every table:** `org_id = auth_org_id()`. Non-negotiable; makes cross-tenant leakage structurally impossible.
2. **Building scope — staff-scoped tables** (residents, rooms, staff, roster_assignments, meal_*, activities, stock_levels, orders, incidents): `building_id = ANY(auth_building_ids())` **unless** `auth_role()` is org-wide (`admin`, `super_admin`).
3. **Resident scope — family tables** (family_posts, visits, messages, photos): `resident_id IN (select resident_id from user_resident_scopes where user_id = auth_uid())`.
4. **Permission matrix — writes:** `INSERT/UPDATE/DELETE` policies call `authorize('<module>','<action>')` in `USING` / `WITH CHECK`. Reads gate on `authorize('<module>','view')`.
5. **Soft delete:** reads via `*_live` views (`deleted_at IS NULL`); `DELETE` is disallowed by policy in favour of `UPDATE deleted_at = now()`.

`super_admin` bypasses layers 2–4 but remains bound by layer 1 (its own org). **Policies are the only authorization source of truth** — the client permission matrix merely mirrors `role_permissions` for UI affordances.

## 8 · Scaling notes

- **Indexes:** every FK; composite `(org_id, building_id)` on hot ops tables; `(resident_id, service_date)` on `meal_intake_logs`; partial indexes `WHERE deleted_at IS NULL` for the live-row hot path.
- **Partition candidates** (documented, built only when volume demands): `meal_intake_logs`, any future `audit_log`, `roster_assignments` — range-partition by month on the date column.
- **Aggregates:** occupancy/stock KPIs as plain views first; promote to materialized views only when measured slow.
- **Multi-tenant upgrade path:** because `org_id`, org-scoped `role_permissions`, and org-scoped lookups exist from day one, going full SaaS = (a) tighten the access-token hook, (b) insert one `organizations` row per tenant, (c) **no schema change**.
- **Shared triggers:** one generic `set_updated_at()` and one `set_created_by()/set_updated_by()` reused across all tables.

## 9 · Migration plan (follow-up phase, not this doc)

1. `000001_extensions_and_enums` — `citext`, `pgcrypto`; all enum types.
2. `000002_identity_tenancy` — organizations, buildings, wings, app_users, scopes, roles, role_permissions.
3. `000003_care_domain` — care_tiers, care_types, residents, resident_flags, rooms, staff.
4. `000004_operations` — roster, meals, activities, stock, incidents.
5. `000005_family_portal` — family_posts, visits, messages, photos.
6. `000006_functions_triggers` — `set_updated_at`, `authorize`, `auth_*` helpers, access-token hook.
7. `000007_rls_policies` — enable RLS + all policies per §7.
8. `000008_views` — `*_live` views + KPI aggregate views.
9. `000009_seed` — one org, 6 roles, default permission matrix, Wesley/Lodge buildings, wings, shift_types.

The app's `lib/mock-data/*` accessors become async Supabase queries with **unchanged call sites**, since the mock shapes already mirror these rows.

## Open questions

1. **Generic `audit_log` table** — you chose soft-delete + audit columns as the baseline and deferred the full trigger-based log. Confirm it stays deferred (vs. adding it now for the regulated incident/meal/medication trail).
2. **`staff` vs `app_users` merge** — kept separate (a staff member may have no login; a login may be non-staff like family). Confirm this separation is desired rather than a single `app_users` with a `is_staff` flag.
3. **Medication records** — mentioned as a compliance concern but **no medication table exists in the current app**. Out of scope here; flag if it should be designed in now.
4. **`super_admin` reach** — modelled as org-bound (each org has its own super admin). If you need a *platform* super-admin that sees across all orgs for support, that's a distinct role with a claim flag — confirm which you want.
