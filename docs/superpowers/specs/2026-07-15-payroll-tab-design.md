# Payroll tab (Staff · Payroll) - Design

**Date:** 2026-07-15
**Screen:** design item **U34** - "Staff · Payroll (rates + totals)" from the Victoria admin dashboard.
**Status:** design approved; ready for implementation plan.

## Purpose

A new admin-only **Payroll** tab on the Staff page (`/portal/staff`). Editable per-role
hourly rates × paid hours drawn from the weekly roster grid give each person's total hours
and gross pay, with per-building subtotals and a total weekly wage bill.

## Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Rate storage | **Persist to DB** - new `staff_roles.hourly_rate` column + server action. |
| Pay week | **Week navigator** like the roster (`?week=YYYY-MM-DD`, default current week). |
| Grouping | **By building** (staff `building_id`) - Wesley now; The Lodge only if staff exist there. |
| Rate used for gross | The staffer's **primary role** (`roles[0]`) rate. |
| Gating | **Admin-only**, lives as a 5th tab inside the existing Staff page. |
| Compute split | **Server** computes immutable paid-hours from the roster; **client** owns editable rates + live gross. |

## Architecture

Roster assignments are the source of truth for hours, so the server computes per-person
paid hours for the selected week; rates are editable client-side and recompute gross live
(matching the design's live recalculation on rate edit). Rate edits persist via a server
action.

```
StaffPage (RSC)
  ├─ reads ?week= + ?staffTab=
  ├─ getStaff / getShiftTemplates / getLeaveRequests / getRoles(+rate) / getRoleGroups   (existing)
  ├─ getPayrollHours(weekStartISO, weekEndISO)   (NEW)  → { [staffId]: {hours, shiftCount} }
  └─ <StaffView initialTab weekStartISO weekLabel payrollHours ... />
        └─ PayrollTab (NEW, client)
             rates state (seed from roles.hourlyRate) → live gross
             rate edit → saveRoleRate (persist) + local recompute
             week nav → router.push(/portal/staff?staffTab=payroll&week=…)
```

## Data model change

**Migration `supabase/migrations/0012_role_hourly_rate.sql`**
- `alter table staff_roles add column hourly_rate numeric(6,2) not null default 0;`
- Seed sensible starting rates (NZD/hr) for the existing seed roles so the screen reads
  meaningfully; admin can adjust anytime:
  Registered Nurse 42, Carer 26.5, Team Leader 32, Care Taker 26.5, Kitchen 24.5, Activities 25.
- RLS unchanged (existing `staff_roles_read` / `staff_roles_write`).

## Data layer

**`src/lib/data/roles.ts` - extend `getRoles`**
- select adds `hourly_rate`; map to `hourlyRate: Number(r.hourly_rate ?? 0)`.

**`src/types/domain.ts` - `RoleDef`** gains `hourlyRate: number`.

**`src/lib/data/payroll.ts` (NEW)**
- `getPayrollHours(weekStartISO, weekEndISO): Promise<Record<string, { hours: number; shiftCount: number }>>`
  - Query `roster_shifts` for building `wesley` in `[weekStart, weekEnd]`, join
    `shift_templates.paid_hours` on `shift_id`.
  - Per staff: `hours = Σ paid_hours`, `shiftCount = Σ assignments`.

## Server action

**`src/lib/actions/roles.ts` - `saveRoleRate(name, rate)`**
- Validate `rate >= 0`; `update staff_roles set hourly_rate = rate where building_id='wesley' and name=…`.
- `revalidatePath('/portal/staff')` and `/portal/roster` (roles shared) on success.

## Page

**`src/app/portal/staff/page.tsx`**
- `searchParams`: `{ week?: string; staffTab?: string }`.
- Compute `weekStart` / `days` via `weekStartOf` / `parseISODate` / `toISODate` / `getRosterDays`
  (reused from mock-data, same as roster page).
- Add `getPayrollHours(weekStartISO, days[6].iso)` to the `Promise.all`.
- Pass `initialTab`, `weekStartISO`, `weekLabel` (Mon–Sun span), `payrollHours` into `StaffView`.

## StaffView

- `Tab` union adds `"payroll"`; `TABS` adds `{ key: "payroll", label: "Payroll" }`.
- Initialise `tab` from `initialTab` (so week-nav reloads keep the payroll tab active).
- Render `<PayrollTab>` when `tab === "payroll"`. No header action button on payroll
  (same as Roles & groups).

## PayrollTab (`src/components/portal/staff/payroll-tab.tsx`, NEW)

**Props:** `staff`, `roles` (with `hourlyRate`), `payrollHours`, `weekStartISO`, `weekLabel`.

**State:** `rates: Record<roleName, number>` seeded from `roles`; `rateError: string | null`.

**Layout (top→bottom), matching the design:**
1. **Hourly rates card** - title "Hourly rates" + helper "Rate per role in NZD…", a week
   badge (`weekLabel`), and one editor chip per role: swatch + role name + `$` `<input
   type=number min=0 step=0.25>`. On change → update local `rates` (live recompute) + call
   `saveRoleRate` (persist; onBlur/debounced). Failure → inline banner, keep local edit.
   Week nav `‹ ›` buttons here → `router.push('/portal/staff?staffTab=payroll&week=…')`.
2. **4 KPI cards** - Weekly wage bill (Σ gross), Paid hours (Σ hours), Rostered staff
   (count hours>0), Avg hours / person.
3. **Per-building sections** - for each building with staff, a header (name + "{n} rostered"),
   then a table: **Staff | Role | Shifts | Hours | Rate/hr | Gross pay**; rows sorted by role
   order then name; a **subtotal** row (building hours + gross).
4. **Total footer bar** (navy) - Paid hours + Gross pay totals.

**Computation (client):**
- Per staffer: `role = roles[0]`, `rate = rates[role] ?? 0`, `hours = payrollHours[id]?.hours ?? 0`,
  `shiftCount = payrollHours[id]?.shiftCount ?? 0`, `gross = hours * rate`, `building = staff.building`.
- Money format NZD (`toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`),
  hours rounded to 1 dp.

## Edge cases

- Staffer with 0 rostered hours → still listed, hours 0 / gross 0; excluded from "Rostered staff".
- Role with no rate → treated as 0.
- All staff are `wesley` this phase → a single "Wesley" section; The Lodge section only when staff exist there.
- Persist failure → keep local edit + inline error banner; no lost input.
- Rate input coerced with `parseFloat`, clamped `>= 0`.

## Styling

Reuse existing tokens: cards `bg-cream-2` + `border-line`; figures/headings `font-serif`
(Newsreader); gold pills (`bg-gold-tint` / `text-bronze-text`); navy footer (`bg-navy-deep`).
Role swatch/pill colours come from the role registry (data, inline - sanctioned).

## Definition of Done

- Migration applies; `staff_roles.hourly_rate` present + seeded.
- Payroll tab renders live: hours from the selected week's roster, gross from editable rates.
- Rate edits persist (survive reload) and recompute live before persist round-trips.
- Week nav reloads the correct week and keeps the payroll tab active.
- Per-building subtotals + total wage bill correct.
- `tsc` / `lint` / `build` clean.

## Open questions

1. **Seed rates** - the seed values above are placeholders drawn from the design's role
   codes mapped to our role names; confirm real rates or start all at 0.
2. **Multi-role staff** - gross uses the primary role (`roles[0]`) rate per the design; if a
   staffer's shifts span roles with different rates, that nuance is not reflected (matches design).
