# Roster & shifts

- **Route:** `/portal/roster` — `app/portal/roster/page.tsx` (async RSC → fetches real staff)
- **Section:** Portal · **Access:** all staff
- **Render:** RSC page loads `getStaff()` → client `RosterView` (editable weekly grid)

## Purpose
Plan the week's shifts as a **real-staff × 7-day** grid. Each staff member (pulled live from the staff directory) gets a row; assign one or more shift types per staff/day and see daily staffing totals.

## Layout
Header (title + week nav + Copy last week + Publish) → shift-type legend bar → the scheduler table. The grid **starts empty** — there is no pre-filled/mock schedule.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `roster-view` | sub = `{week title} · {n} staff · {n} shifts assigned`; ‹ › week nav, "Copy last week" (inert), **Publish roster** → "Published ✓" on click |
| Shift legend | `shift-legend` | one swatch + code + time per shift type (14 types via `getShiftLegend()`) |
| Scheduler | `roster-grid` | `<table>`: navy header (# / Staff / 7 days) · one row per real staff (name only) · totals footer "Staff on duty" |
| Day cell | `roster-cell` | shift chips (code+time) or faint "+"; click opens popover picker (toggle shift types, "Day off" clears) |
| Empty state | inline in `roster-view` | when no staff exist, a dashed card points to the Staff screen |

## Data consumed
- **Staff rows:** `getStaff()` (Supabase `staff`, `StaffRecord`) — name/initials/color only on the grid.
- **Shift vocabulary + scaffold:** `getShiftDefs()`, `getShiftLegend()`, `getRosterDays()`, `dailyTotals()`, `totalShifts()`, `ROSTER_WEEK_TITLE`, `SHIFT_ORDER` (from `roster-schedule.ts` — shift-type reference data only, no mock staff/assignments).

## Variants & states (client)
- `grid: RosterGrid` — `grid["{row}-{col}"] = shiftId[]`, initialised **empty** (`{}`). `openCell` (open popover), `published` (label toggles).
- `dailyTotals` / `totalShifts` recompute from the grid on every edit.

## Interactions
- Click cell → open picker; toggle a shift type → add/remove; "Day off" → clear. All client state.
- Week nav, Copy last week — inert this phase. Publish flips the button label (no persistence).

## Tokens
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned). Table header `bg-navy-deep` + `text-cream`; totals `font-serif`.

## Removed
- The **Duty roster export** (modal + A4 print preview) and its derivation/types/print-CSS — removed with the mock roster data it depended on.
- The mock **Leave & requests** section (staff Leave lives on the Staff screen).
- The mock roster staff (18 fabricated people), pre-filled default grid, and the Pos column.

## Out of scope (this phase)
Persisting the roster (no `roster_assignments` table yet), publishing, week navigation, copy-last-week. Shift assignment is client-only, in-memory.

## Future DB notes
`shift_types` (lookup: code, label, time, colors), `roster_assignments(id, building_id, staff_id, work_date, shift_type_id)` — one row per assigned (staff, day, shift). Rows already come from the live `staff` table; assignments would move `grid` state into `roster_assignments`. `toggleShift` → insert/delete an assignment; Publish flips a `published_at`/status on the week. Scoped by `building_id`.
