# Staff (Administration)

- **Route:** `/portal/staff` — `app/portal/staff/page.tsx`
- **Section:** Portal · Administration group · **Access:** admin only
- **Render:** RSC page fetches Supabase data → client `StaffView` (tabs, forms are stateful)

## Purpose
Manage the team roster (employment + leave-balance record), define shift-coverage templates, and review/approve leave requests — for the **active building** (`wesley`, constant this phase). Three tabs: **Team**, **Shift templates**, **Leave requests**.

## Layout
Header (title + building sub + tab-specific action button) → 4 KPI cards (total staff / on shift today / on leave / pending requests) → pill tabs → active tab body.

## Sections & components
| Tab | Component | Notes |
|-----|-----------|-------|
| Header | inline | sub = `{active building} · manage your team and shift coverage`; action button swaps per tab (`+ Add staff` / `+ Add shift` / `+ Add leave`) |
| Team | `team-tab` | Directory table: avatar+name+"Since {start}", role, wing, contract pill + weekly hours, **Leave** column (`taken/annual`), phone, status dot, edit/delete actions |
| Shift templates | `shift-templates-tab` | Two-column cards: swatch + name + time, gap badge ("N open" vs "Fully staffed"), **coverage bar** (`filled/req`, sage when staffed / terracotta when short), edit action |
| Leave requests | `leave-tab` | Row list: avatar + name·type, date range + day count, optional note, status pill; **Approve/Decline** actions only on `Pending` rows (Approved/Declined rows are read-only history) |

Shared modals (owned by `StaffView`): `staff-form` (add/edit team member), `shift-template-form` (add/edit shift template), `leave-form` (add-only leave request), `confirm-delete-modal` (reused from Stock, staff removal only).

## Data flow (Supabase)
RSC `page.tsx` calls `src/lib/data/staff.ts` (`getStaff`, `getShiftTemplates`, `getLeaveRequests`) and passes the results into `<StaffView>` as props — no client-side fetching for initial load. Writes go through Server Actions in `src/lib/actions/staff.ts`:

- `saveStaff` / `deleteStaff` — upsert/delete `staff` profile fields (name, role, wing, contract → derived `hours`, phone). Edit never touches `annual`/`taken` — those are only adjusted via `approve_leave`, so re-saving a profile can't clobber balances. New rows seed `annual: 20, taken: 0`.
- `saveShiftTemplate` / `deleteShiftTemplate` — upsert/delete `shift_templates`; a chosen base color resolves to its matching tint/border pair from a fixed 6-entry palette.
- `saveLeave` — insert a `leave_requests` row (`status: "Pending"`).
- `approveLeave` — calls the `approve_leave(p_id)` RPC: sets `status = "Approved"`, and for `Annual leave`/`Sick leave` types atomically debits `staff.taken` by the request's `days`. No-op if already approved.
- `declineLeave` — updates `leave_requests.status = "Declined"` directly (no balance effect).

All actions `revalidatePath("/portal/staff")` on success. RLS: `{table}_read`/`{table}_write` policies, authenticated-only (see `docs/03-data-model.md`).

## Variants & states (client)
- `tab` ∈ {team, shifts, leave}.
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
