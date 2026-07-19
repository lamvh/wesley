# Roster & shifts

- **Route:** `/portal/roster` - `app/portal/roster/page.tsx` (async RSC → fetches real staff + saved assignments)
- **Section:** Portal · **Access:** all staff
- **Render:** RSC page reads `?week=YYYY-MM-DD` (defaults to the current Mon–Sun week), loads `getStaff()` + `getRosterAssignments()` → client `RosterView` (editable weekly grid, keyed per week)

## Purpose
Plan the week's shifts as a **real-staff × 7-day** grid. Each staff member (pulled live from the staff directory) gets a row, **banded and ordered by role group** (Nurses & HCAs → Care Takers → Kitchen, defined in Staff → Roles & groups); assign one or more shift types per staff/day and see daily staffing totals.

## Layout
Header (title + week nav + **Export duty roster** + Publish) → shift-type legend bar → the scheduler table. The grid **starts empty** - there is no pre-filled/mock schedule.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `roster-view` | sub = `{week title} · {n} staff · {n} shifts assigned`; ‹ › week nav (navigate `?week=`, working), **Export duty roster** (opens the duty modal), **Publish roster** → "Published ✓" on click |
| Shift legend | `shift-legend` | one swatch + code + time per shift type - the **real** shift templates (Supabase `shift_templates`, managed in Staff → Shift templates) |
| Scheduler | `roster-grid` | `<table>` inside a bounded **vertical scroll box** (`max-h`, `overflow-auto`): navy header (# / Staff / 7 days) **sticky at top** + each group's band header row **sticky just below it**, so the weekday and group name stay visible while scrolling · staff rows **banded by role group** (each band led by a coloured header row: group label + member count, in group order, "Unassigned" band last) with continuous row numbering · totals footer "Staff on duty" |
| Day cell | `roster-cell` | shift chips (code+time) or faint "+"; click opens popover picker (toggle shift types, "Day off" clears). The picker is **portalled to `document.body` (fixed, anchored to the cell)** so the grid's scroll box never clips it; it closes on scroll/resize. **Role-constrained:** the picker only lists shifts whose role shares the staff member's role group (see `rosterPickersFor`); a staffer matching no shift falls back to the full list |
| Empty state | inline in `roster-view` | when no staff exist, a dashed card points to the Staff screen |
| Duty roster export | `duty-roster-modal` → `duty-roster-preview` / `duty-roster-sheet` | **Export duty roster** opens a config modal (scope: single day / whole week only) → full-screen A4 print preview built from the live grid. Print-sheet chrome: navy + gold header rule, centred serif "Duty Roster" title with an italic "Daily staff assignments · MON 13/07/26" subtitle, a **Wesley | The Lodge** building header row, then assigned staff grouped by role band under **centred band headers**, each band split into **two per-building columns** (Wesley left / The Lodge right) by the building each shift belongs to (`ShiftType.building`, from `shift_templates.building_id`) - empty column shows an em-dash. Names in caps; a dual-segment shift time prints one line per segment. `window.print()` / native print CSS renders exactly **one A4 page per day** (single-day export no longer spills onto a second page). Deep-linkable via `?duty=1`. Builder: `lib/duty-roster.ts` (`buildDutySheets`). **On-call and Chef were dropped from the export** (modal + print sheet) per design v2.5 - the roster grid's own per-day **on-call row** (`onCallByDay`/`onCallOptions`, distinct feature) is unaffected. |

## Data consumed
- **Staff rows:** `getStaff()` (Supabase `staff`, `StaffRecord`) - name/initials/color on the grid; roles + groups (`getRoles()` / `getRoleGroups()`, `lib/data/roles.ts`) drive the banding via `groupStaffForRoster()` (`lib/roster-grouping.ts`). A staffer whose roles span multiple groups bands into their **`rosterGroupId` override** when set (chosen in the Staff form); otherwise the **earliest eligible group** by sort order. Single-group staff are unambiguous and never need the override. **Within a band**, staff are ordered by their role priority (`staff_roles.sort_order`, set in Roles & groups) - e.g. Registered Nurses appear above Carers.
- **Saved assignments:** `getRosterAssignments(weekStartISO, weekEndISO)` (`lib/data/roster.ts`) → Supabase `roster_shifts` rows for the visible week, folded into a `RosterGrid`.
- **Shift vocabulary:** `getRosterShiftTypes()` (`lib/data/roster.ts`) → maps the real Supabase `shift_templates` for the roster's building (via `getShiftTemplates(BUILDING)`) into the `ShiftType` shape the legend/picker/grid consume; each carries its **`role`** for the per-staff picker constraint. Cells reference these template ids; an assignment whose template was deleted is skipped rather than crashing.
- **Per-staff pickers:** `rosterPickersFor(staff, roles, shiftTypes)` (`lib/roster-grouping.ts`) → `staffId → allowed ShiftType[]`: a shift is offered only to staff holding a role in the shift role's group (role-less shifts are unrestricted).
- **Scaffold/helpers:** `getRosterDays(weekStart)`, `dailyTotals()`, `totalShifts()`, `rosterWeekTitle()`, week helpers (`weekStartOf`, `toISODate`, `parseISODate`, `shiftWeek`) from `roster-schedule.ts`.

## Variants & states (client)
- `grid: RosterGrid` - `grid["{staffId}::{YYYY-MM-DD}"] = shiftId[]`, **seeded from `initialGrid`** (saved week). `RosterView` is keyed by `weekStartISO` so it reseeds when the week changes. `openCell` (open popover), `published` (label toggles).
- `onCallByDay: Record<dateISO, staffId>` - **seeded from `initialOnCallByDay`** (saved week), same reseed-on-week-change behaviour as `grid`.
- `dailyTotals` / `totalShifts` recompute from the grid on every edit (optimistic).

## Interactions
- Click cell → open picker; toggle a shift type → add/remove; "Day off" → clear.
- **Auto-save:** every toggle updates local state optimistically **and** calls a server action (`toggleRosterShift` / `clearRosterCell` in `lib/actions/roster.ts`) that upserts/deletes the `roster_shifts` row and `revalidatePath("/portal/roster")`.
- **On-call auto-save:** picking a name in the grid's On-call row updates local state optimistically **and** calls `setOnCallDay` / `clearOnCallDay` (`lib/actions/roster.ts`), which upsert/delete the `roster_on_call` row for that date.
- **Week nav:** ‹ › push `?week=` ±7 days via the router; the RSC reloads that week's saved assignments (grid + on-call).
- **Export duty roster** → config modal → A4 print preview (`window.print()`). Publish flips the button label (no persistence yet).

## Tokens
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned). Table header `bg-navy-deep` + `text-cream`; totals `font-serif`.

## Removed
- The mock **Leave & requests** section (staff Leave lives on the Staff screen).
- The mock roster staff (18 fabricated people), pre-filled default grid, and the Pos column.

Note: the **Duty roster export** was reinstated (rebuilt on real staff + real templates + role bands); see the Duty roster export row above.

## Persistence
- **Table:** `roster_shifts(id, building_id, staff_id, shift_date, shift_id, created_at)` - one row per assigned (staff, day, shift), `unique(staff_id, shift_date, shift_id)`, `staff_id` FK `on delete cascade`, RLS read/write for authenticated. Migration `supabase/migrations/0006_roster_shifts.sql` (apply via `scripts/db/apply-migration.mts`).
- Grid keys use `staffId::date` (not a positional row/col index) so assignments stay attached to the right person when the staff list reorders.
- **Table:** `roster_on_call(id, building_id, on_call_date, staff_id, created_at)` - one row per date, `unique(building_id, on_call_date)` (a later pick replaces via upsert), `staff_id` FK `on delete cascade`, RLS read/write for authenticated. Migration `supabase/migrations/0017_roster_on_call.sql`. `getOnCallByDay(weekStartISO, weekEndISO)` (`lib/data/roster.ts`) loads the visible week's assignments; option `value` in the picker is the staff **id** (not name), matching how it's now stored.

## Out of scope (this phase)
Copy-last-week, publishing a locked/`published_at` week. Assignment persistence + week navigation are now implemented.
