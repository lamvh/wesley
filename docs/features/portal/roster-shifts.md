# Roster & shifts

- **Route:** `/portal/roster` - `app/portal/roster/page.tsx` (async RSC → fetches real staff + saved assignments)
- **Section:** Portal · **Access:** all staff
- **Render:** RSC page reads `?week=YYYY-MM-DD` (defaults to the current Mon–Sun week), loads `getStaff()` + `getRosterAssignments()` → client `RosterView` (editable weekly grid, keyed per week)

## Purpose
Plan the week's shifts as a **real-staff × 7-day** grid. Each staff member (pulled live from the staff directory) gets a row, **banded and ordered by role group** (Nurse → HCA → Care Takers → Kitchen, defined in Staff → Roles & groups; see "Nurse/HCA group split" below), plus a trailing "Unassigned" band for roles in no group; assign one or more shift types per staff/day and see daily staffing totals.

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
| Duty roster export | `duty-roster-modal` → `duty-roster-preview` → `duty-sheet-document` | **Export duty roster** opens a config modal (scope: single day / whole week only) → full-screen A4 print preview built from the live grid. Each A4 sheet is the shared **`DutySheetDocument`** (`components/portal/roster/duty-sheet-document.tsx`) — the **same component the public `/today` board renders**, so export and board are pixel-identical. Sheet chrome: navy + gold header rule, centred serif "Duty Roster" title with an italic "Daily staff assignments · MON 13/07/26" subtitle, a **Wesley | The Lodge** building header row, then shifts grouped under **centred band headers**, each band split into **two per-building columns** (Wesley left / The Lodge right) by the building each shift belongs to (`ShiftType.building`, from `shift_templates.building_id`) - empty column shows an em-dash. **Each shift is placed by the group of _its own role_** (`ShiftType.role → RoleDef.groupId → RoleGroup`), **not the staffer's roster band** - a staffer covering a shift outside their band (e.g. a nurse on a kitchen shift) appears under that shift's group. Bands render in group `sortOrder`; a shift whose role maps to no group (or is unrestricted) falls into a trailing **Unassigned** band. **Kitchen is a single band shared across both buildings** (fills the Wesley column, Lodge blank), held separate by `buildDutySheets` (any group whose label matches `isKitchen` from `lib/today-board.ts`) — matching `/today`. Names in caps; a dual-segment shift time prints one line per segment. `window.print()` / native print CSS renders exactly **one A4 page per day** (single-day export no longer spills onto a second page). Deep-linkable via `?duty=1`. Builder: `lib/duty-roster.ts` (`buildDutySheets`, returns `sections` + `kitchen`). **On-call re-added (2026-07-20)** as a read-only strip below the building header - sourced live from the roster grid's per-day on-call row (`onCallByDay`, resolved staff id → name), no separate modal input; **Chef stays dropped** per design v2.5 (never persisted, out of scope). **Default export scope is "day"** (`DUTY_DEFAULTS`, `lib/duty-roster.ts`) - opening the modal and printing without touching the toggle prints the current day only, matching the design source's default. **Eyebrow "Wesley Home & Care"**, **footer** just the date, right-aligned (both live in `DutySheetDocument`). |

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
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned), set per-template via the swatch picker in Staff → Shift templates (`SHIFT_PALETTE`, `lib/actions/staff.ts`) — each shift template keeps its own distinct color, not derived from role. Table header `bg-navy-deep` + `text-cream`; totals `font-serif`.

## Shift chip color history (2026-07-20)

A same-day round trip on how shift chip colors are sourced:

1. **Root cause reported:** shifts looked hard to tell apart on the grid.
2. **First fix (reverted):** `getRosterShiftTypes()` (`lib/data/roster.ts`) was changed to override each shift's chip color with its **role's** color (`staff_roles.color`/`tint`, the "Roles & groups" registry), so same-role shifts shared one color and different roles stood apart. This also surfaced a data bug: migration `0007_role_groups.sql` bulk-seeded the base role registry without setting `color`/`tint`, so every seeded role sat on the same column default (`#5B5347`/`#EFE7D7`) — the reason everything still rendered as one color right after deploying the role-color fix. `supabase/migrations/0020_backfill_role_colors.sql` backfills distinct colors for any role still on that default (from the same 8-color `PALETTE` `saveRole()` draws from for roles created via the UI) — this migration is still in place and still useful (role colors back roles' own badges/chips elsewhere), independent of the revert below.
3. **Reverted:** deriving from role turned out to be the wrong axis — shift templates were already seeded with distinct colors per shift (`scripts/db/seed-staff.mts`, sh1–sh6, six different hex triples), so role-derivation actually **collapsed** that distinction (e.g. a Carer's Morning/Afternoon/Night shifts, previously three different colors, all became the one Carer-role color). `getRosterShiftTypes()` now reads `t.color`/`t.tint`/`t.border` straight off the template again, matching what the "Shift templates" admin tab's swatch picker sets.

Because the roster grid, the cell picker popover, and the duty export sheet all read the same `ShiftType[]` from `getRosterShiftTypes()`, this is consistent across all three without touching those components.

## Nurse/HCA group split (2026-07-20)

The roster band "Nurses & HCAs" (`role_groups` id `nurses_hcas`, seeded by `0007_role_groups.sql`) grouped `Registered Nurse`, `Carer`, and `Team Leader` into one band. Split into two distinct bands: **Nurse** (`Registered Nurse`) and **HCA** (`Carer`). `Team Leader` is deliberately left **unassigned** (not merged into either), an explicit call rather than a default — it now bands into the trailing "Unassigned" group like any other role with no `group_id`.

`supabase/migrations/0021_split_nurse_hca_groups.sql` adds the two new `role_groups` rows (`nurses`, `hcas`), reassigns `staff_roles.group_id` for the three affected roles, and deletes the old `nurses_hcas` group (safe: `staff_roles.group_id` is `on delete set null`, so any straggler drops to Unassigned rather than orphaning). No app code change — `groupStaffForRoster()` (`lib/roster-grouping.ts`) already bands purely off `role_groups`/`staff_roles` data.

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

## Fixed (2026-07-20): duty print showed duplicate pages

Reported: "bấm print duty mặc định lại export ra 2 trang" (default print gave 2 identical pages) and, for whole-week export, "print still show duplicate monday page" (Monday repeated instead of the other days). Two distinct causes, both fixed:

1. **Wrong default scope.** `DUTY_DEFAULTS` was `{ scope: "week", day: 0 }` - opening "Export duty roster" and printing without touching the toggle exported the whole week (up to 7 pages), not the single current day the design defaults to. Fixed to `{ scope: "day", day: 0 }` (matches `.design-src`'s `dutyForm: { scope: pick('dutyScope', 'day'), ... }`).
2. **`position: fixed` print duplication.** `DutyRosterPreview`'s full-screen overlay wrapper was `fixed inset-0`. Per CSS2.1 §9.3.1, `position: fixed` boxes are repeated on every printed page (this is how print CSS makes running headers/footers) - so the overlay, and the `.duty-sheets` it positions, redrew the first sheet on top of every page instead of letting each day flow to its own page. Fixed by adding a `duty-preview-overlay` class and a `@media print` override that drops it to `position: static` (see `globals.css`), so `.duty-sheets`' own `position: absolute` + `.duty-sheet:not(:last-child) { page-break-after: always }` drive pagination normally.

Also removed the `overflow: hidden` on `.duty-sheet` added by the earlier "fix in single-day tràn 2 trang" pass (2026-07-20, same day) - that hypothesis (overflow-hidden + absolutely-positioned header bars causing duplication) didn't reproduce in an isolated headless-Chrome repro and is superseded by the `position: fixed` finding above; content is sized to fit one page by design, so the clip was unnecessary defense.

**Not independently verified with an automated print-page-count check** - a headless `--print-to-pdf` repro was built to test hypotheses but gave inconsistent/unreliable pagination results unrelated to the actual fix (didn't even paginate a trivial 3-page test correctly), so it couldn't confirm the final state. `tsc`/eslint/`next build` are clean and the change is structurally minimal, but please verify visually: `/portal/roster` → Export → Single day → Print, and → Whole week → Print, before treating this as closed.
