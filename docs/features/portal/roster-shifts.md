# Roster & shifts

- **Route:** `/portal/roster` — `app/portal/roster/page.tsx` (async; `?duty=1` opens the duty print preview on load)
- **Section:** Portal · **Access:** all staff
- **Source:** Design `Victoria at Mt Eden.dc.html` — roster page (`pRoster`) + duty export overlays (`dutyOpen` modal, `dutyPreview` print sheet)
- **Render:** RSC page → client `RosterView` (editable weekly grid + duty export)

## Purpose
Plan the week's shifts as a staff × 7-day grid, and export a print-ready **duty roster** (a clean names + times sheet, split by building and duty category) for posting/PDF.

## Layout
Header (title + week nav + Copy / **Export duty roster** / Publish) → shift-type legend bar → the scheduler table → Leave & requests list. Two overlays layer on top: the duty **config modal** and the full-screen **print preview**.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `roster-view` | sub = `{week title} · {n} staff · {n} shifts assigned`; ‹ › week nav, "Copy last week", **Export duty roster** (opens modal), **Publish roster** → "Published ✓" on click |
| Shift legend | `shift-legend` | one swatch + code + time per shift type (14 types via `getShiftLegend()`) |
| Scheduler | `roster-grid` | `<table>`: navy header (# / Staff / Pos / 7 days) · one row per staff (18) · totals footer "Staff on duty" |
| Day cell | `roster-cell` | shift chips (code+time) or faint "+"; click opens popover picker (toggle shift types, "Day off" clears) |
| Leave & requests | `leave-request-row` (reused) | Approve/Decline inert |
| Duty config | `duty-roster-modal` | scope (Single day / Whole week), Day select, On call + Chef selects; "Generate & preview" |
| Duty preview | `duty-roster-preview` + `duty-roster-sheet` | full-screen overlay, sticky toolbar (Print / Save PDF · Close), one A4 sheet per day |

## Data consumed
`getShiftDefs()`, `getShiftLegend()`, `getRosterStaff()`, `getRosterDays()`, `getDefaultRosterGrid()`, `dailyTotals()`, `totalShifts()`, `ROSTER_WEEK_TITLE`, `SHIFT_ORDER`, `getLeaveRequests()`, and for the export: `DUTY_DEFAULTS`, `buildDutySheets()`, `getDutyDayOptions()`, `getDutyStaffOptions()`, `getDutySheetTitle()`.

## Roster data (this revision)
- **18 staff** across two buildings — 13 Wesley + 5 The Lodge. Each `RosterStaff` now carries `duty` (`nurse` | `ac` | `hca` | `ct` | `kitchen`) and `building` (`wesley` | `lodge`). These are invisible on the grid but drive the duty export's grouping/columns.
- **14 shift types** (`m, ms, d, mid, e, a, la, ev, n, nl, tld, tll, k, kl`) — each with code/label/time + `color`/`tint`/`border` data. Split shifts (e.g. `e` = `8:30–18:00 + 18:00–21:00`) expand to two duty lines.

## Duty roster export
- **Trigger:** "Export duty roster" header button → config modal. "Generate & preview" → print preview. `?duty=1` opens the preview directly with `DUTY_DEFAULTS`.
- **Config (`DutyForm`):** `scope` (day/week), `day` (column index when day-scope), `onCall`, `chef`.
- **Sheet (`buildDutySheets`):** per selected day → sections **NURSE / A/C / HCA / CARE TAKER**, each a two-column grid **Wesley | The Lodge** of `{time, name(UPPER)}` rows (empty column → em-dash). A **Kitchen** block (Chef + kitchen shifts) follows. On-call strip up top; footer shows the date (`DOW DD/07/26`). Whole-week scope yields 7 sheets.
- **Print:** `globals.css` `@media print` hides everything except `.duty-sheets`, forcing one A4 portrait page per `.duty-sheet` (`page-break-after`). Toolbar is `.duty-toolbar` (hidden on print). "Print / Save PDF" calls `window.print()`.

## Variants & states (client)
- `grid: RosterGrid` — `grid["{row}-{col}"] = shiftId[]`; `openCell` (open popover).
- `published` (label toggles), `dutyOpen`, `dutyPreview`, `dutyForm`.
- `dutySheets` recompute (`useMemo`) from grid + form on every edit.

## Interactions
- Click cell → open picker; toggle a shift type → add/remove; "Day off" → clear. Client state.
- Export duty roster → modal → preview → browser print. Publish flips the button label.
- Week nav, Copy last week, Approve/Decline — **inert** this phase.

## Tokens
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned). Duty sheet uses a print-document palette added to `globals.css` (`--color-duty-ink/-time/-rule/-strip/-empty/-foot/-close`) plus `navy-deep` / `bronze-text` / `cream`. Table header `bg-navy-deep`; totals `font-serif`; Pos pill `bg-toggle-track`.

## Out of scope (this phase)
Persisting the roster, publishing, week navigation, copy-last-week, leave approvals. The duty export is derived live from the in-memory grid (no server round-trip).

## Definition of Done
Grid renders all 18 staff × 7 days with correct chips; cell picker toggles shifts; totals update live; Export flow opens modal → A4 preview → prints one page per day; horizontal scroll inside the table only; tokens/inline-data only; `tsc`/`lint`/`build` clean.

## Future DB notes
`shift_types` (lookup: code, label, time, colors), `roster_assignments(id, building_id, staff_id, work_date, shift_type_id)` — one row per assigned (staff, day, shift). `staff.duty_category` + `staff.building_id` back the duty grouping. See 03-data-model.md → "Roster scheduling". `toggleShift` → insert/delete an assignment; `dailyTotals`/`totalShifts` → aggregate queries; the duty sheet is a read-only projection; Publish flips a `published_at`/status on the week. Scoped by `building_id`.
