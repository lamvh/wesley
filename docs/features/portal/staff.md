# Staff (Administration)

- **Route:** `/portal/staff` — `app/portal/staff/page.tsx`
- **Section:** Portal · Administration group · **Access:** admin only
- **Render:** RSC page fetches Supabase data → client `StaffView` (tabs, forms are stateful)

## Purpose
Manage the team roster (employment + leave-balance record), organise roles into groups, define shift-coverage templates, and review/approve leave requests — for the **active building** (`wesley`, constant this phase). Four tabs: **Team**, **Roles & groups**, **Shift templates**, **Leave requests**.

## Layout
Header (title + building sub + tab-specific action button) → 4 KPI cards (total staff / on shift today / on leave / pending requests) → pill tabs → active tab body.

## Sections & components
| Tab | Component | Notes |
|-----|-----------|-------|
| Header | inline | sub = `{active building} · manage your team and shift coverage`; action button swaps per tab (`+ Add staff` / `+ Add shift` / `+ Add leave`; **no button on Roles & groups** — add is inline there) |
| Team | `team-tab` | Directory table: avatar+name+"Since {start}", **roles** (one or more chips), contract pill + weekly hours, **Visa** (type + colored expiry chip: red expired / amber ≤60d / green), **Leave left** column (`remaining/annual` + mini bar, terracotta when ≤2 days else sage), phone, status dot, edit/delete actions. **Client search** (name/role/contract/visa/phone/status) + **pagination** (6/page): search box + "X–Y of Z" count above the table, numbered pager (‹ 1 2 … ›) below; searching resets to page 1 |
| Roles & groups | `roles-groups-tab` | **Role registry CRUD** + **ordered groups** that band/sort the roster. Groups list (reorder ↑/↓, rename via add-form, delete → members fall back to Unassigned) with member-role chips (removable) + "+ Add role…" select + staff-count pill; an **Unassigned roles** bucket (assign-to-group select); an **All roles** list (color swatch, group, staff count, delete — blocked while assigned) + "Add role" form. Admin only |
| Shift templates | `shift-templates-tab` | **Compact cards, 3 per row, grouped by building** (building header + shift count). Each card: swatch + name, **role pill** (colour from the role registry), `time · Nh paid` payroll line, gap badge ("N open" vs "Fully staffed"), **coverage bar** (`filled/req`, sage when staffed / terracotta when short), edit + remove actions |
| Leave requests | `leave-tab` | **Two columns.** Left — requests list (`{pending} pending` pill): avatar + name·type, `dates · N shifts · note` line, **Approve/Decline** on `Pending` rows only (decided rows show a status pill), plus a **remove** button on every row. Right — **Annual leave balance** card: per-staff `remaining of annual left` + progress bar (terracotta ≤2 / amber ≤5 / sage) |

Shared modals (owned by `StaffView`): `staff-form` (add/edit team member), `shift-template-form` (add/edit shift template), `leave-form` (add-only leave request), `confirm-delete-modal` (reused from Stock, staff removal only).

**Staff form fields:** name, **roles** (MULTI-**select** via `staff-role-picker` — a staffer can hold several roles; toggle one or more chips; **at least one role required**), **Roster group** (only shown when the selected roles span **>1 group** — pins which roster band the staffer sits in; hidden/auto when roles map to a single group), contract, phone, **work visa type** (`NZ Citizen / Permanent Resident / Work Visa / Student Visa / Working Holiday / Essential Skills`), **visa expiry date** (shown only when the type has an expiry; cleared for citizens/PR). Role options come from the **registry** (`getRoles()`); a staffer's existing roles are always shown even if later removed from the registry. **Role creation/deletion is no longer inline** — it lives only in the Roles & groups tab (the picker shows a "managed in Roles & groups" note). The **Wing** field was removed — staff are not wing-scoped.

## Data flow (Supabase)
RSC `page.tsx` calls `src/lib/data/staff.ts` (`getStaff`, `getShiftTemplates`, `getLeaveRequests`) **and `src/lib/data/roles.ts` (`getRoles`, `getRoleGroups`)**, passing the results into `<StaffView>` as props — no client-side fetching for initial load. Role/group writes go through `src/lib/actions/roles.ts` (`saveRole`, `deleteRole`, `assignRoleToGroup`, `saveGroup`, `deleteGroup`, `moveGroup`) — each `revalidatePath` both `/portal/staff` and `/portal/roster` (roles/groups drive the roster banding too). `deleteRole` is blocked while any staffer still holds the role. Other writes go through Server Actions in `src/lib/actions/staff.ts`:

- `saveStaff` / `deleteStaff` — upsert/delete `staff` profile fields (name, `roles text[]` + `role` = primary/`roles[0]`, contract → derived `hours`, phone, `visa_type`, `visa_expiry`, **`roster_group_id`** = optional roster-band override, null unless roles span >1 group; migration `0009_staff_roster_group.sql`). At least one role required. `visa_expiry` is forced null for `NZ Citizen`/`Permanent Resident`. Edit never touches `annual`/`taken` — those are only adjusted via `approve_leave`, so re-saving a profile can't clobber balances. New rows seed `annual: 20, taken: 0`. **Requires migrations `0004_staff_visa.sql`** (visa columns) **and `0005_staff_multi_role.sql`** (adds `roles text[]`, backfills from `role`).
- `saveShiftTemplate` / `deleteShiftTemplate` — upsert/delete `shift_templates`, now carrying **`role`** (registry role name — constrains the roster picker), **`paid_hours`** (payroll figure, quarter-hour precision) and a chosen **`building_id`**. A chosen base color resolves to its matching tint/border pair from a fixed **12-entry palette**. **Requires migration `0008_shift_role_paid_hours.sql`** (adds `role`, `paid_hours`; backfills seed templates).
- `saveLeave` — insert a `leave_requests` row (`status: "Pending"`); types include `Annual leave / Sick leave / Shift swap / Bereavement / Unpaid leave`.
- `deleteLeave` — delete a `leave_requests` row (remove button on each leave row).
- `approveLeave` — calls the `approve_leave(p_id)` RPC: sets `status = "Approved"`, and for `Annual leave`/`Sick leave` types atomically debits `staff.taken` by the request's `days`. No-op if already approved.
- `declineLeave` — updates `leave_requests.status = "Declined"` directly (no balance effect).

All actions `revalidatePath("/portal/staff")` on success. RLS: `{table}_read`/`{table}_write` policies, authenticated-only (see `docs/03-data-model.md`).

## Variants & states (client)
- `tab` ∈ {team, roles, shifts, leave}.
- Team tab: local `query` (search) + `page` (pagination, 6/page), clamped to the filtered result count.
- Roles & groups tab: server-action driven (optimistic via `useTransition`), inline error banner on any rejection (e.g. deleting a role still in use).
- Staff form: add mode (`editStaff` = null) vs edit mode (populated).
- Shift-template form: same add/edit pattern (`editShift`).
- Leave form: add-only — requests are resolved via Approve/Decline, never edited.
- Leave tab shows an inline error banner on approve/decline failure (`leaveError`).

## Interactions
- Header action button dispatches per active tab (`+ Add staff` / `+ Add shift` / `+ Add leave`).
- `handleApproveLeave(id)` / `handleDeclineLeave(id)` call the corresponding Server Action directly with a `FormData`; failures surface in the inline banner rather than throwing.
- `requestDeleteStaff(s)` routes through the shared `ConfirmDeleteModal`.

## Tokens
Shift-template swatch/tint/border are **data** (inline style, sanctioned, drawn from the fixed 6-color palette). Coverage bar width computed inline (sanctioned). Active tab `bg-navy-deep text-cream`; header action button `bg-navy`; card titles `font-serif`; contract/status/leave-status pills via `staffContractMeta`/`staffStatusMeta`/`leaveStatusMeta` (`lib/design-meta.ts`).

## Definition of Done
All three tabs render live Supabase data; team add/edit/delete persist (profile fields only — balances untouched); shift-template add/edit/delete persist; leave request submission persists as Pending; approve debits `staff.taken` for Annual/Sick leave atomically via RPC; decline updates status only; `tsc`/`lint`/`build` clean.

## Relationship to Roster
The Roster screen (`/portal/roster`) has its own read-only leave list (`LeaveRequestRow`, type `LeaveRequest`, mock data `lib/mock-data/staff-shifts.ts`) with **inert** Approve/Decline buttons — no mutation. That list is unrelated to this screen and was left untouched; leave approval now lives exclusively on `/portal/staff`, backed by the distinct `StaffLeaveRequest` type and the `approve_leave` RPC.

## Data model
See `docs/03-data-model.md` → "Staff administration" for the live schema (extended `staff` columns, `shift_templates`, `leave_requests`), RLS, and the `approve_leave` RPC.
