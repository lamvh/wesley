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
| Day cell | `roster-cell` | shift chips (code+time) or faint "+"; click opens popover picker (toggle shift types, "Day off" clears). The picker is **portalled to `document.body` (fixed, anchored to the cell)** so the grid's scroll box never clips it; it closes on scroll/resize, and **on picking a shift**. **Role-constrained + grouped:** the picker only lists shifts whose role shares the staff member's role group, laid out in **Group → Role → shift** sections with headers (see `rosterPickersFor`); a staffer matching no shift falls back to the full list. Leads with a **"Thường làm"** shortcut of that staffer's most-assigned shifts — see below |
| Empty state | inline in `roster-view` | when no staff exist, a dashed card points to the Staff screen |
| Duty roster export | `duty-roster-modal` → `duty-roster-preview` → `duty-sheet-document` | **Export duty roster** opens a config modal (scope: single day / whole week only) → full-screen A4 print preview built from the live grid. Each A4 sheet is the shared **`DutySheetDocument`** (`components/portal/roster/duty-sheet-document.tsx`) — the **same component the public `/today` board renders**, so export and board are pixel-identical. Sheet chrome: navy + gold header rule, centred serif "Duty Roster" title with an italic "Daily staff assignments · MON 13/07/26" subtitle, a **Wesley | The Lodge** building header row, then shifts grouped under **centred band headers**, each band split into **two per-building columns** (Wesley left / The Lodge right) by the building each shift belongs to (`ShiftType.building`, from `shift_templates.building_id`) - empty column shows an em-dash. **Each shift is placed by the group of _its own role_** (`ShiftType.role → RoleDef.groupId → RoleGroup`), **not the staffer's roster band** - a staffer covering a shift outside their band (e.g. a nurse on a kitchen shift) appears under that shift's group. Bands render in group `sortOrder`; a shift whose role maps to no group (or is unrestricted) falls into a trailing **Unassigned** band. **Kitchen is a single band shared across both buildings** (fills the Wesley column, Lodge blank), held separate by `buildDutySheets` (any group whose label matches `isKitchen` from `lib/today-board.ts`) — matching `/today`. Names in caps; a dual-segment shift time prints one line per segment. `window.print()` / native print CSS renders exactly **one A4 page per day** (single-day export no longer spills onto a second page). Deep-linkable via `?duty=1`. Builder: `lib/duty-roster.ts` (`buildDutySheets`, returns `sections` + `kitchen`). **On-call re-added (2026-07-20)** as a read-only strip below the building header - sourced live from the roster grid's per-day on-call row (`onCallByDay`, resolved staff id → name), no separate modal input; **Chef stays dropped** per design v2.5 (never persisted, out of scope). **Default export scope is "day"** (`DUTY_DEFAULTS`, `lib/duty-roster.ts`) - opening the modal and printing without touching the toggle prints the current day only, matching the design source's default. **Eyebrow "Wesley Home & Care"**, **footer** just the date, right-aligned (both live in `DutySheetDocument`). |

## Data consumed
- **Staff rows:** `getStaff()` (Supabase `staff`, `StaffRecord`) - name/initials/color on the grid; roles + groups (`getRoles()` / `getRoleGroups()`, `lib/data/roles.ts`) drive the banding via `groupStaffForRoster()` (`lib/roster-grouping.ts`). A staffer whose roles span multiple groups bands into their **`rosterGroupId` override** when set (chosen in the Staff form); otherwise the **earliest eligible group** by sort order. Single-group staff are unambiguous and never need the override. **Within a band**, staff are ordered by their role priority (`staff_roles.sort_order`, set in Roles & groups) - e.g. Registered Nurses appear above Carers.
- **Saved assignments:** `getRosterAssignments(weekStartISO, weekEndISO)` (`lib/data/roster.ts`) → Supabase `roster_shifts` rows for the visible week, folded into a `RosterGrid`.
- **Shift vocabulary:** `getRosterShiftTypes()` (`lib/data/roster.ts`) → maps the real Supabase `shift_templates` for the roster's building (via `getShiftTemplates(BUILDING)`) into the `ShiftType` shape the legend/picker/grid consume; each carries its **`role`** for the per-staff picker constraint. Cells reference these template ids; an assignment whose template was deleted is skipped rather than crashing.
- **Per-staff pickers:** `rosterPickersFor(staff, roles, shiftTypes, groups)` (`lib/roster-grouping.ts`) → `staffId → RosterPickerGroup[]`: the same role-group filter (a shift is offered only to staff holding a role in the shift role's group; role-less shifts are unrestricted), then folded into **Group → Role → shift** sections. Each `RosterPickerGroup` has a role-group `label` header and `roles[]`; each `RosterPickerRole` has the role `label` sub-header + its `shifts`. Groups order by `RoleGroup.sortOrder`; roles by `RoleDef.sortOrder`. Shifts whose role maps to no group fall into a trailing **"Unassigned"** section; truly role-less shifts into a trailing **"Any role"** section. `roster-cell` renders the nested sections (group header → role sub-header → shift buttons).
- **Assigned-but-out-of-scope shifts:** a shift already assigned in a cell but not in that staffer's role-filtered options (e.g. the shift's role was removed from the staffer, or the staffer's role changed after assigning) is still surfaced in the picker under a trailing **"Assigned · other roles"** section — computed per-cell in `roster-cell` from `ids` vs the shift ids in `pickerDefs` — so it stays visible and can be toggled off (never silently stranded).
- **Scaffold/helpers:** `getRosterDays(weekStart)`, `dailyTotals()`, `totalShifts()`, `rosterWeekTitle()`, week helpers (`weekStartOf`, `toISODate`, `parseISODate`, `shiftWeek`) from `roster-schedule.ts`.

## Variants & states (client)
- `grid: RosterGrid` - `grid["{staffId}::{YYYY-MM-DD}"] = shiftId[]`, **seeded from `initialGrid`** (saved week). `RosterView` is keyed by `weekStartISO` so it reseeds when the week changes. `openCell` (open popover), `published` (label toggles).
- `onCallByDay: Record<dateISO, staffId>` - **seeded from `initialOnCallByDay`** (saved week), same reseed-on-week-change behaviour as `grid`.
- `dailyTotals` / `totalShifts` recompute from the grid on every edit (optimistic).

## Interactions
- Click cell → open picker; toggle a shift type → add/remove **and the picker closes**; "Day off" → clear (also closes). Closing on pick suits the data: only ~1.5% of filled cells hold more than one shift (max 2), so keeping the popover open cost a dismissing click on nearly every assignment. Stacking a second shift means reopening the cell.
- **Auto-save:** every toggle updates local state optimistically **and** calls a server action (`toggleRosterShift` / `clearRosterCell` in `lib/actions/roster.ts`) that upserts/deletes the `roster_shifts` row and `revalidatePath("/portal/roster")`.
- **On-call auto-save:** picking a name in the grid's On-call row updates local state optimistically **and** calls `setOnCallDay` / `clearOnCallDay` (`lib/actions/roster.ts`), which upsert/delete the `roster_on_call` row for that date.
- **Week nav:** ‹ › push `?week=` ±7 days via the router; the RSC reloads that week's saved assignments (grid + on-call).
- **Copy last week:** toolbar **"Copy tuần trước"** copies every staffer's shifts; the **⟲** button that appears on a staff row when hovered copies just that person. See "Copy last week" below.
- **Staff detail:** clicking a row's avatar + name opens that staffer's editable detail form (the shared `StaffForm`). See "Staff detail from the roster" below.
- **Show / hide times:** toolbar **"Hiện giờ / Ẩn giờ"** toggles the time line on chips and in the picker. Off by default, and persisted — see "Shift times are opt-in" below.
- **Per-band coverage:** each band closes with a **"Ca đã xếp / cần"** row — see "Per-band daily coverage" below.
- **Approved leave** shows in the day cell as a dashed marker — see "Approved leave on the grid" below.
- **Export duty roster** → config modal → A4 print preview (`window.print()`). Publish flips the button label (no persistence yet).

## Tokens
Shift types carry their own `color`/`tint`/`border` (**data** → inline style on chips/legend/picker swatches, sanctioned), set per-template via the swatch picker in Staff → Shift templates (`SHIFT_PALETTE`, `lib/actions/staff.ts`) — each shift template keeps its own distinct color, not derived from role. Table header `bg-navy-deep` + `text-cream`; totals `font-serif`.

## Approved leave on the grid (2026-07-27)

A day cell shows a dashed **leave marker** (the request's type) when an approved leave request covers that staffer on that date, so the scheduler can see who is away while assigning.

**Only approved requests appear.** A pending one hasn't been agreed yet and must not read as settled leave.

**The marker sits above any shifts rather than replacing them.** A shift assigned on an approved day off is a real clash the scheduler needs to see, so it is called out rather than hidden: the marker turns from amber to rust and gains a ⚠ when the cell also holds shifts, with the count in its tooltip.

`getApprovedLeaveByDay(weekStartISO, weekEndISO)` (`lib/data/roster.ts`) returns `"{staffId}::{dateISO}" → leave type`. Requests are clamped to the visible week and walked a day at a time, so a request that starts before or ends after the week marks only the days inside it. An **open-ended** request (`to_date` null) runs from its start to the end of the week, matching how `getStaff()` decides who is on leave today. A read failure returns `{}` — the marks are decoration and must never fail the page.

`approveLeave`, `declineLeave` and `deleteLeave` (`lib/actions/staff.ts`) all revalidate `/portal/roster` as well as `/portal/staff`, since each of them changes what the grid should show. `saveLeave` does not: it creates a **Pending** request, which the roster deliberately ignores.

Verified by `scripts/db/verify-roster-approved-leave.mts` (throwaway staff row on 2099 dates, cleaned up): pending is invisible, a multi-day request expands inclusively, over-long requests clamp to the week, open-ended runs to the week's end, and leave in another week doesn't leak in.

No schema change — `leave_requests` already carried everything needed.

## Per-band daily coverage (2026-07-27)

Every band closes with a **"Ca đã xếp / cần"** row: for each day, how many shifts that band's staff are assigned against how many the band needs, so an under-covered day is visible without counting chips. A short day renders bold in `text-rust`.

The requirement is not a new setting — it comes from `shift_templates.req`, the headcount each template already records, summed per role group by `shiftRequirementByBand()` (`lib/roster-grouping.ts`). `req` is populated with real values (e.g. Registered Nurse has six templates at `req` 1). Templates with no role, or a role in no group, count towards the **Unassigned** band, matching where their staff land. `ShiftType` gained a `req` field to carry it through.

**Assumption:** every template runs every day. Templates carry no per-weekday schedule, so the requirement is a flat per-day figure. A band with no `req` recorded shows a bare count instead of an `n / m` ratio.

Note the two axes differ by design: the count is of shifts assigned to **staff in that band** (the rows directly above it), whereas the duty export groups each shift by **its own role's group**. A staffer covering a shift outside their band is counted here in their band, and printed there under the shift's group.

## Shift times are opt-in (2026-07-27)

Chips and picker rows can show a shift's `time` under its name, but **most templates are named after their own hours** — `6:45 - 15:15`, `TL: 16:15 - 22:45` — so the line simply repeats the name. It is therefore **off by default**, with a toolbar toggle to bring it back for the handful of templates that carry a real name (`Chef`, `Night`, `Morning + Stock`, `KH`).

The preference is stored in localStorage under `wesley.roster.showTimes`, because `RosterView` is keyed on the week and remounts on every week change — component state would reset each time the user paged forward.

It is read through `usePersistedToggle` (`lib/use-persisted-toggle.ts`), which wraps `useSyncExternalStore`. Seeding `useState` from localStorage desyncs hydration (the server has no such value), and writing it back in an effect trips `react-hooks/set-state-in-effect`; `useSyncExternalStore` is the hook built for exactly this — it serves the server snapshot for the first paint, then re-renders with the stored one.

## Deactivated staff (2026-07-27)

A staffer who has left is **deactivated, not deleted**: the "Đang làm việc" checkbox in the staff form (edit mode only) writes `staff.status = 'Inactive'`.

`activeStaff()` (`lib/data/staff.ts`) filters them out at the roster page, so they stop occupying a row — and, since the duty sheet is built from the same bands, stop appearing on the printed sheet. Their record, leave balances and shift history are untouched, and they remain listed in Staff → Team with a grey "Inactive" badge so they can be brought back.

`status` also carries the derived "On leave" value, which is never written to the DB (see "On leave is derived" in [staff.md](staff.md)); the form only ever writes `Active` or `Inactive`.

## Staff detail from the roster (2026-07-27)

The avatar + name in a roster row is a button: clicking it opens that staffer's detail form, editable in place, without leaving the roster.

It mounts the **same `StaffForm`** the Staff screen uses (`components/portal/staff/staff-form.tsx`) rather than a roster-local copy, so editing a staff member is defined in exactly one place. `StaffForm` is a self-contained modal that submits through `saveStaff` and closes itself on success, so the roster only supplies the target record and an `onClose`. It is mounted only while a target is set — the form derives all its state at mount, so switching rows has to remount it.

No extra server-side loading was needed: `/portal/roster` already loads `getStaff()`, `getRoles()` and `getRoleGroups()`, which is exactly what the form's `staff` / `roleOptions` / `roleDefs` / `groups` props require.

One change outside the roster was required: `saveStaff` and `deleteStaff` (`lib/actions/staff.ts`) previously revalidated only `/portal/staff`. They now revalidate `/portal/roster` as well — the roster renders the same records, and the **roles** it saves decide which band a staffer sits in, so an edit made from the roster has to land back on the grid. Only `grid` and `onCallByDay` are seeded client state in `RosterView`; `staff`, `roles` and `groups` are props, so they pick the revalidated data up without a remount.

Opening the form also dismisses any open cell picker, so the popover isn't left hanging behind the modal.

## "Thường làm" shift suggestions (2026-07-27)

The cell picker leads with **Thường làm** — up to four of that staffer's most-assigned shifts, each with a `×N` tally — so the common case doesn't mean walking the Group → Role → shift tree. The full tree still follows underneath.

**Signal: total frequency per staffer, not per weekday.** Per-weekday ("she works mornings on Mondays") is the stronger signal in principle, and it was measured before choosing: as of 2026-07-27 the history held 186 assignments across 4 weeks for 37 staff, median 4 shifts each, and only **25 of 154** (staff, weekday, shift) combinations had ever repeated. A weekday-keyed suggestion would mostly be extrapolating from a single occurrence, so it was dropped. Plain per-staff frequency ranks usefully on the same data — 31 of 36 staff have at least one shift assigned twice or more.

**Window: the 8 weeks *before* the displayed week.** The displayed week is deliberately excluded — it is the week being edited, so counting it would let a shift just assigned by hand promote itself above a genuine habit.

`getShiftUsageByStaff(weekStartISO)` (`lib/data/roster.ts`) returns the **full** sorted list per staffer rather than a top-N. The picker filters it to shifts that staffer can actually be given (role-group filtered, same set the tree offers) and to shifts not already in the cell, *then* caps at four. Trimming in the reader instead would silently shrink the shortcut after a role change. Ties break on shift id so the order is stable between renders. A read error returns `{}` and the section simply doesn't render.

Verified by `scripts/db/verify-shift-usage-suggestions.mts` (read-only): window closes before the displayed week, no rows leak in from it, lists are ordered descending, and the result is rankable rather than everything tied at one.

No schema change.

## Copy last week (2026-07-27)

Pulls the previous week's assignments onto the week on screen — the whole grid from the toolbar button, or one person from the **⟲** button in their row (hidden until the row is hovered or the button is focused, so the name column doesn't carry 38 controls at once).

**Merge, never overwrite.** Shifts the target week already has are left exactly as they are; only the missing ones are added. `copyPreviousWeek(weekStartISO, staffId?)` (`lib/actions/roster.ts`) reads the previous week's rows, shifts each `shift_date` forward seven days (same weekday), and writes them with `upsert(..., { onConflict: "staff_id,shift_date,shift_id", ignoreDuplicates: true })`. That leans on the `unique (staff_id, shift_date, shift_id)` constraint `roster_shifts` has carried since `0006_roster_shifts.sql`, so the operation is idempotent — pressing the button twice adds nothing the second time.

`.select()` under `DO NOTHING` returns **only the rows actually inserted**, and that list is the action's return value (`RosterCopyResult.added`). The client merges it straight into `grid`. This matters: `grid` is `useState(initialGrid)` and `RosterView` only remounts when `weekStartISO` changes, so `router.refresh()` would re-run the RSC without the grid ever picking up the new props.

Verified against the live DB by `scripts/db/verify-roster-copy-week.mts` (uses throwaway dates in 2099 and cleans up): first copy lands on the same weekday +7d, second copy adds zero rows, copying over a hand-edited week adds zero rows, and the target cell ends up holding both the copied and the hand-added shift.

No schema change.

## Shift chip color history (2026-07-20)

A same-day round trip on how shift chip colors are sourced:

1. **Root cause reported:** shifts looked hard to tell apart on the grid.
2. **First fix (reverted):** `getRosterShiftTypes()` (`lib/data/roster.ts`) was changed to override each shift's chip color with its **role's** color (`staff_roles.color`/`tint`, the "Roles & groups" registry), so same-role shifts shared one color and different roles stood apart. This also surfaced a data bug: migration `0007_role_groups.sql` bulk-seeded the base role registry without setting `color`/`tint`, so every seeded role sat on the same column default (`#5B5347`/`#EFE7D7`) — the reason everything still rendered as one color right after deploying the role-color fix. `supabase/migrations/0020_backfill_role_colors.sql` backfills distinct colors for any role still on that default (from the same 8-color `PALETTE` `saveRole()` draws from for roles created via the UI) — this migration is still in place and still useful (role colors back roles' own badges/chips elsewhere), independent of the revert below.
3. **Reverted:** deriving from role turned out to be the wrong axis — shift templates were already seeded with distinct colors per shift (`scripts/db/seed-staff.mts`, sh1–sh6, six different hex triples), so role-derivation actually **collapsed** that distinction (e.g. a Carer's Morning/Afternoon/Night shifts, previously three different colors, all became the one Carer-role color). `getRosterShiftTypes()` now reads `t.color`/`t.tint`/`t.border` straight off the template again, matching what the "Shift templates" admin tab's swatch picker sets.

Because the roster grid, the cell picker popover, and the duty export sheet all read the same `ShiftType[]` from `getRosterShiftTypes()`, this is consistent across all three without touching those components.

### Widening the palette (2026-07-27)

Keeping colour per template (step 3 above) was right, but the seeded data did not actually supply enough distinct colours: 26 templates shared only 11 colour triples, and a single mustard `#87651A` sat on **eight** of them — so the grid still read as one colour.

`scripts/db/emit-shift-template-colors-sql.mts` regenerates the whole set from a palette of 14 hue families, each with a pale and a deep fill (a family only spends its deep variant once it has to cover a second shift). The families are hand-tuned rather than swept through HSL — an even HSL sweep gives wildly uneven *perceived* lightness, which is what makes chips hard to tell apart in the first place. The script **refuses to emit** if any ink/fill pair drops below WCAG AA 4.5:1, and warns if two shifts would land on the same colour. Result: 26 templates, 26 distinct colour pairs.

A second strategy that assigns hue by time of day (`--strategy=timeofday`, warm morning → cool night) is implemented but **not used**: with 26 shifts it collides in 8 places (only 18 distinct pairs), because there are far more morning shifts than a band has families to spend.

Data-only change — output is `supabase/seed/0005_shift_template_colors.sql`, one `update` per template id touching just the three colour columns, safe to re-run. Regenerate after adding or removing a template.

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

## Preferred name (2026-07-22)
- `staff.preferred_name` (nullable, migration `0023_staff_preferred_name.sql`) — the name a staffer likes to be called. When set, it shows **in place of** the legal name on the roster grid (staff-row chip), the on-call picker/row, and the **duty-export sheet** — all via the shared helper `staffDisplayName(s) = s.preferredName || s.name` (`src/lib/staff-display.ts`). Falls back to `name` when empty.
- Entered on the **Staff form** ("Preferred name" field, optional); persisted by `saveStaff` (`preferred_name`). Avatar **initials/colour stay derived from `name`** (unchanged). The Staff Team table keeps showing the legal `name`.
- `/today` applies the same fallback server-side in the `today_on_duty`/`today_on_call` RPCs — see [today-roster.md](../marketing/today-roster.md).

## Out of scope (this phase)
Copy-last-week, publishing a locked/`published_at` week. Assignment persistence + week navigation are now implemented.

## Fixed (2026-07-20): duty print showed duplicate pages

Reported: "bấm print duty mặc định lại export ra 2 trang" (default print gave 2 identical pages) and, for whole-week export, "print still show duplicate monday page" (Monday repeated instead of the other days). Two distinct causes, both fixed:

1. **Wrong default scope.** `DUTY_DEFAULTS` was `{ scope: "week", day: 0 }` - opening "Export duty roster" and printing without touching the toggle exported the whole week (up to 7 pages), not the single current day the design defaults to. Fixed to `{ scope: "day", day: 0 }` (matches `.design-src`'s `dutyForm: { scope: pick('dutyScope', 'day'), ... }`).
2. **`position: fixed` print duplication.** `DutyRosterPreview`'s full-screen overlay wrapper was `fixed inset-0`. Per CSS2.1 §9.3.1, `position: fixed` boxes are repeated on every printed page (this is how print CSS makes running headers/footers) - so the overlay, and the `.duty-sheets` it positions, redrew the first sheet on top of every page instead of letting each day flow to its own page. Fixed by adding a `duty-preview-overlay` class and a `@media print` override that drops it to `position: static` (see `globals.css`), so `.duty-sheets`' own `position: absolute` + `.duty-sheet:not(:last-child) { page-break-after: always }` drive pagination normally.

Also removed the `overflow: hidden` on `.duty-sheet` added by the earlier "fix in single-day tràn 2 trang" pass (2026-07-20, same day) - that hypothesis (overflow-hidden + absolutely-positioned header bars causing duplication) didn't reproduce in an isolated headless-Chrome repro and is superseded by the `position: fixed` finding above; content is sized to fit one page by design, so the clip was unnecessary defense.

**Not independently verified with an automated print-page-count check** - a headless `--print-to-pdf` repro was built to test hypotheses but gave inconsistent/unreliable pagination results unrelated to the actual fix (didn't even paginate a trivial 3-page test correctly), so it couldn't confirm the final state. `tsc`/eslint/`next build` are clean and the change is structurally minimal, but please verify visually: `/portal/roster` → Export → Single day → Print, and → Whole week → Print, before treating this as closed.

## Weekly hours column (2026-07-27)
The grid ends in an **Hours · This week** column (`roster-hours-cells.tsx`): paid hours + shift count per staff row, a subtotal on each band footer, and the week's grand total in the "Staff on duty" row.

**Computed client-side from the grid, not fetched.** The roster is interactive, so a server-read figure would show the last saved arithmetic while the user is mid-edit - read as the saved truth, and wrong. `staffWeekHours()` (`lib/mock-data/roster-schedule.ts`) walks the same `grid` the cells render from, so the total moves with every assignment. This required adding `paidHours` to `ShiftType`, which previously carried everything about a shift template *except* its hours.

A shift whose template has no `paid_hours` contributes **0 hours but still counts as a shift**, so an unconfigured template shows as a gap between the two numbers rather than disappearing. All 26 templates currently in use have hours set.

Same arithmetic as the Payroll tab's `getPayrollHours()`, which reads the persisted rows server-side. Two paths to one number is where drift lives, so `scripts/db/verify-roster-week-hours.mts` asserts they agree - **4/4 PASS** on the real week (34 staff, 140 shifts, 1049 hours), per staffer and in total.
