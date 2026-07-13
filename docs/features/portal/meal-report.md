# Meal report

- **Route:** `/portal/meal-report` — `app/portal/meal-report/page.tsx`
- **Section:** Portal · **Access:** all staff (carers log intake)
- **Source:** `.design-src/victoria-all-screens-v2.html` lines 1034–1077 (markup), 1367–1375 + 1687–1704 (logic/data)
- **Render:** RSC page → client island `MealReportView` (intake log is stateful)

## Purpose
Daily record of every resident's food intake per meal, so poor eating is caught early and escalated to an RN. Filled in each shift by carers.

## Layout
Header row (title + date/logged-by + Submit) → 4 summary tiles → one table (resident × Breakfast/Lunch/Dinner intake + note).

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `meal-report-view` | eyebrow "Daily record", title "Meal report", sub; right: date, "Logged by {me}", **Submit report** (inert) |
| Summary tiles (4) | inline | Entries logged (`logged/total`, `{pct}% complete`), Ate well (sage), Poor intake (gold), Refused (rust) — live from `summariseMealLog` |
| Intake table | `meal-report-row` × N | cols `1.7fr 1.1fr 1.1fr 1.1fr 1.3fr` = Resident / Breakfast / Lunch / Dinner / Notes |
| Intake selector | `intake-cell` | segmented 4-button group (All/Most/Some/Refused); selected uses `intakeMeta[level].badge` |

## Data consumed
- `getMealReportResidents()` → `MealReportResident{ idx, name, room, initials, color, diet }` (derived from residents).
- `getDefaultMealLog()` → `MealLog` seed; `summariseMealLog(count, log)` → summary tiles.
- `intakeMeta[level]`, `INTAKE_LEVELS`, `MEAL_SLOTS`.

## Variants & states
- Intake per (resident, meal) ∈ {all, most, some, refused, unset}. Clicking the active level again clears it.
- Summary recomputes on every change (client state via `useState`).
- Rows with no logged meals count toward "Entries logged" denominator only.

## Interactions
- Click intake level → `setIntake(idx, slot, level)` (client). **Submit report** and note inputs are inert this phase.

## Tokens
`intakeMeta` semantic scale (all=sage, most=cat-craft, some=gold, refused=rust); `bg-cream-2` cards; `font-serif` numbers; `text-ink-faint` for unselected options.

## Out of scope (this phase)
Persisting intake, Submit report, per-row notes — all UI-only until the DB layer lands.

## Definition of Done
Table renders all residents; selecting/clearing intake updates the 4 tiles live; matches the design; tokens only; RSC page + single client island; `tsc`/`lint`/`build` clean.

## Future DB notes
Writes to `meal_intake_logs` (see docs/03-data-model.md → "Meal intake logs"): one row per (resident_id, service_date, meal_slot) with `intake_level`, `note`, `logged_by`. The client state map `MealLog[residentIdx][slot]` becomes upserts keyed on `(resident_id, service_date, meal_slot)`. Summary tiles become an aggregate query. `getMealReportResidents()` → `select` residents in care; `getDefaultMealLog()` → `select today's logs`.
