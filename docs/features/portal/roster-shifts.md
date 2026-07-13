# Roster & shifts

- **Route:** `/portal/roster` — `app/portal/roster/page.tsx`
- **Section:** Portal · **Access:** all staff
- **Source:** `.design-src/victoria-all-screens-v3.html` lines 810–898 (markup), 1660–1730 + 1835–1878 (logic/data)
- **Render:** RSC page → client `RosterView` (editable weekly grid)

## Purpose
Plan the week's shifts as a staff × 7-day grid. Assign one or more shift types per staff/day, see daily staffing totals, and manage leave — the weekly scheduler for the home.

## Layout
Header (title + week nav + Copy/Publish) → shift-type legend bar → the scheduler table → Leave & requests list.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `roster-view` | sub = `{week title} · {n} staff · {n} shifts assigned`; ‹ › week nav, "Copy last week", **Publish roster** (all inert) |
| Shift legend | `shift-legend` | one swatch + code + time per shift type (`getShiftLegend()`) |
| Scheduler | `roster-grid` | `<table>`: navy header (# / Staff / Pos / 7 days) · one row per staff · totals footer "Staff on duty" |
| Day cell | `roster-cell` | shift chips (code+time) or faint "+"; click opens popover picker (toggle shift types, "Day off" clears) |
| Leave & requests | `leave-request-row` (reused) | Approve/Decline inert |

## Data consumed
`getShiftDefs()`, `getShiftLegend()`, `getRosterStaff()`, `getRosterDays()`, `getDefaultRosterGrid()`, `dailyTotals()`, `totalShifts()`, `ROSTER_WEEK_TITLE`, `SHIFT_ORDER`, `getLeaveRequests()`.

## Variants & states (client)
- `grid: RosterGrid` — `grid["{row}-{col}"] = shiftId[]`. `openCell` (which popover is open).
- Cell = empty ("+"), 1 chip, or multiple chips (e.g. `[tld, tll]`).
- `dailyTotals` / `totalShifts` recompute from the grid on every edit.

## Interactions
- Click cell → open picker; toggle a shift type → add/remove in that cell; "Day off" → clear cell. All client state.
- Week nav, Copy last week, Publish roster, Approve/Decline — **inert** this phase.

## Tokens
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned). Table header `bg-navy-deep` + `text-cream`; totals `font-serif`; Pos pill `bg-toggle-track`.

## Out of scope (this phase)
Persisting the roster, publishing, week navigation, copy-last-week, leave approvals.

## Definition of Done
Grid renders all staff×days with correct chips; cell picker toggles shifts; totals update live; horizontal scroll inside the table only; tokens/inline-data only; `tsc`/`lint`/`build` clean.

## Future DB notes
`shift_types` (lookup: code, label, time, colors), `roster_assignments(id, building_id, staff_id, work_date, shift_type_id)` — one row per assigned (staff, day, shift). See 03-data-model.md → "Roster scheduling". `toggleShift` → insert/delete an assignment; `dailyTotals`/`totalShifts` → aggregate queries; Publish flips a `published_at`/status on the week. Scoped by `building_id`.
