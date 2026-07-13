# Users & access

- **Route:** `/portal/users` — `app/portal/users/page.tsx`
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
| Roles tab | `roles-permissions` | left: role cards (dot, label, count, desc, "{granted} permissions"); right: permission matrix for `selectedRole` |
| Permission matrix | `permission-switch` per cell | rows = modules (10), cols = View/Create/Edit/Delete; super_admin locked |
| Add user | `add-user-modal` | name, email, role grid, scope; Cancel / Add (inert) |

## Data consumed
- `getUsers()` → `User[]`; `getModules()` → `AppModule[]` (10); `getDefaultPermissions()` → `PermissionMatrix`; `countGranted(modules, perms[role])`; `ROLE_KEYS`.
- `userRoleMeta[role]` (badge/label/desc), `userStatusMeta[status]` (text/dot).

## Variants & states (client)
- `tab` ∈ {users, roles}; `roleFilter` ∈ {all, …roles}; `selectedRole` (default admin); `perms` (editable matrix copy); `addUserOpen`; `form`.
- **super_admin** row/role: all permissions granted, toggles locked (notice shown).
- User `status` ∈ {Active, Invited, Suspended} → dot + label via `userStatusMeta`.
- Filter narrows the user table by role.

## Interactions
- Tab switch, role-filter select, role-card select — client state.
- Toggle permission → `togglePerm(role, moduleKey, action)` (no-op for super_admin), flips a cloned matrix.
- Add user modal open/close; submit **inert** (no persistence this phase).

## Tokens
`userRoleMeta` (super_admin=navy, admin=rust, nurse=cat-craft, carer=sage, activities=gold, family=cat-music); switch on=`bg-sage`, off=`bg-line-strong`; navy active tabs/pills.

## Out of scope (this phase)
Creating/inviting/suspending users, persisting permission edits, the ⋯ row menu — UI-only until DB + auth land.

## Definition of Done
Both tabs render; filters + role selection + permission toggles work in-session; super_admin locked; modal opens/closes; tokens only; RSC page + client island; `tsc`/`lint`/`build` clean.

## Future DB notes
Backs the RBAC tables in docs/03-data-model.md → "Users, roles & permissions": `users`, `roles`, `role_permissions` (role × module × action grant), plus `user_scopes`. `togglePerm` → upsert on `role_permissions`; Add user → insert `users` (status `Invited`) + send invite; `getDefaultPermissions()` seeds `role_permissions`. Auth (Supabase) maps the session user → `users.role`; the same matrix drives server-side authorization (RLS + route guards), not just UI.
