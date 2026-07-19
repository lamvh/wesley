# Users & access

- **Route:** `/portal/users` - `app/portal/users/page.tsx`
- **Section:** Portal · **Access:** admin / super-admin only
- **Source:** `.design-src/victoria-all-screens-v2.html` lines 1080–1210 (screen + add-user modal), 1283–1365 + 1637–1685 (roles, permissions, data)
- **Render:** RSC page → client island `UsersView` (tabs, filters, permission toggles, modal are all stateful)

## Purpose
Super-admin control of who can access the platform and what each role may do. Manage user accounts and edit the role→permission matrix (RBAC).

## Layout
Header (title + Add user) → pill tabs (Users / Roles & permissions) → tab body. Add-user modal overlays.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `users-view` | "Super admin" eyebrow, title, **+ Add user** (opens modal) |
| Tabs | inline | "Users · {count}" / "Roles & permissions"; active = navy fill |
| Users tab | `role-filter-pills` + `user-table` | filter pills (All + per-role counts); table cols `2.2fr 1.3fr 1.5fr 1fr 1fr 40px` = User / Role / Scope / Status / Last active / ⋯ |
| Roles tab | `roles-permissions` | left: role cards (dot, label, count, desc, "{granted} permissions") - sourced from real `public.roles` (`roles` prop), not the `ROLE_KEYS` mock; inline **rename** (pencil icon) on non-system roles → `renameUserRole`; right: permission matrix for `selectedRole`, header now shows the real role label |
| Permission matrix | `permission-switch` per cell | rows = modules (10), cols = View/Create/Edit/Delete; super_admin locked |
| Add / edit user | `add-user-modal` | name, username, email, password, role grid (real `roles`), building select, scope |
| Removed toggle | inline in `users-view` | "Đã xoá (N)" link swaps the table for a recoverable list |

## Data consumed
- `listAppUsers()` / `listRemovedAppUsers()` (`src/lib/data/users.ts`) → `User[]`; `listUserRoles()` (`src/lib/data/user-roles.ts`) → real `public.roles` incl. `is_system`; `listBuildings()` (`src/lib/data/buildings.ts`) → `public.buildings`; `getModules()` → `AppModule[]` (10); `getDefaultPermissions()` → `PermissionMatrix`; `countGranted(modules, perms[role])`.
- `userRoleMeta[role]` supplies **presentation only** (dot colour, badge tint, description) - the rendered role **name/label** everywhere (role cards, permission-matrix header, user-table badge, add/edit-user role grid, filter pills) comes from the real `roles` prop, not `userRoleMeta[role].label`. `userStatusMeta[status]` (text/dot) is still fully static (no per-status DB row exists).

## Variants & states (client)
- `tab` ∈ {users, roles}; `roleFilter` ∈ {all, …roles}; `selectedRole` (default admin); `perms` (editable matrix copy); `addUserOpen`; `form`.
- **super_admin** row/role: all permissions granted, toggles locked (notice shown).
- User `status` ∈ {Active, Invited, Suspended} → dot + label via `userStatusMeta`.
- Filter narrows the user table by role.

## Interactions
- Tab switch, role-filter select, role-card select - client state.
- Toggle permission → `togglePerm(role, moduleKey, action)` (no-op for super_admin), flips a cloned matrix.
- Add user modal open/close; **Add** → `createUser` server action; **Save changes** (editing) → `updateUser`; row ⋯ **Delete** → `deleteUser` (soft), confirm modal first; "Đã xoá" toggle → recoverable list, **Khôi phục** → `recoverUser`. All four `router.refresh()` on success.
- Role card **rename** (pencil icon, hidden for `is_system` roles i.e. `super_admin`) → inline edit → `renameUserRole(id, label)` server action, updates `public.roles.label` via the service-role client (no write RLS policy exists for regular sessions); `revalidatePath` refreshes every screen that reads `listUserRoles()`.

## Tokens
`userRoleMeta` (super_admin=navy, admin=rust, nurse=cat-craft, carer=sage, activities=gold, family=cat-music, stock_manager=bronze); switch on=`bg-sage`, off=`bg-line-strong`; navy active tabs/pills.

## Out of scope (this phase)
Persisting Roles & permissions matrix edits, wiring nav/route guards to per-module `role_permissions` (today gating is the coarse admin/staff map), Supabase invite email flow.

## Definition of Done
Both tabs render; filters + role selection + permission toggles work in-session; super_admin locked; modal opens/closes; Create/Read/Update/soft-Delete/Recover all persist to Supabase; role/building options come from real data; `tsc`/`lint`/`build` clean.

## DB status
The RBAC tables are **live in the DB** (`supabase/migrations/0001_core_schema.sql`, applied + seeded): `roles` (7, incl. `stock_manager` added in `0019_stock_manager_role.sql`), `role_permissions` (the full 7×10×4 = 280 grant matrix, seeded from `getDefaultPermissions()` via `scripts/db/seed-core-schema.mts` - re-run manually after the migration), and `app_users` (name/email/`role_id`/`status`/`building_id`/`deleted_at`, linked to `auth.users` by `auth_id`). Full account CRUD is **live** - Create, Read, Update (all fields incl. username/email/password), soft-Delete + Recover (`supabase/migrations/0015_app_users_soft_delete.sql`) - see "Users full CRUD" in `docs/03-data-model.md`. Still pending: `togglePerm` → upsert `role_permissions`; wiring nav/route guards to the `role_permissions` matrix. `user_scopes` remains deferred (see docs/03-data-model.md).

### `stock_manager` role (2026-07-20)
New account role scoped to stock/supplies ordering only: `dashboard` view + full `stock` CRUD (view/create/edit/delete), no access to any other module in the default permission preset (`preset.stock_manager` in `src/lib/mock-data/users.ts`). Badge token = bronze (`userRoleMeta.stock_manager`). Migration `0019_stock_manager_role.sql` seeds the `public.roles` row; requires **manual apply** + re-running `seed-core-schema.mts` to populate `role_permissions` for the new role id (same manual-DB pattern as other pending migrations - see master plan open items). No nav/route guard exists yet for any role (see "Out of scope" above), so this only affects the Roles & permissions tab default matrix and the role picker/badges today.
