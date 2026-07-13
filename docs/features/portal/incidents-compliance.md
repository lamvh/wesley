# Incidents & compliance

- **Route:** `/portal/incidents` — `app/portal/incidents/page.tsx`
- **Section:** Portal · **Access:** admin
- **Source:** lines `834–860` (screen) + `1272–1289` (`sevMeta`, `statMeta`, `incidentsRaw`, `incidents`, `compKpis` data)
- **Render:** RSC (no client islands — static content, inert button only)

## Purpose
Admin compliance dashboard: logged incidents (falls, near-misses, behavioural episodes) with severity/status plus audit-readiness KPIs, so the facility manager can track open items and MoH audit prep. Admin-only (source `pIncidents`).

## Layout
Single centred column inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Header row** — flex, title/subtitle left, "+ Report incident" button right (`align-items:flex-end`, `space-between`, wraps).
2. **KPI row** — 4-col grid (`repeat(4,1fr)`, gap `16px`), margin-top `22px`. One `KpiCard` per `compKpis` entry.
3. **Incidents table** — single `cream-2` panel, radius `16px`, `overflow:hidden`, margin-top `16px`: header row + one body row per incident.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | `PortalPageHeader` (shared) | `title` "Incidents & compliance" (Newsreader `32px`/500); `subtitle` "Ministry of Health certified · next audit 14 Sep 2026" (`muted` `15px`); `action` slot. Source 837. |
| Report-incident button | `Button` (shadcn, `variant=primary`) | Accent fill, cream text, radius `11px`, pad `9px 16px`, `14px`/600. Label "+ Report incident". Inert this phase. Source 838. |
| KPI row | `page.tsx` grid section | `repeat(4,1fr)` gap `16px`. Maps `compKpis` → `KpiCard`. Source 840–844. |
| KPI card (×4) | `kpi-card` (shared `components/shared/kpi-card.tsx`) | Same as Stock: `cream-2`/`border`, radius `16px`, pad `18px 20px`; label `muted-2` `13px`/600, value Newsreader `30px` (colour from entry), sub `muted-2` `12.5px`. Source 842. |
| Incidents table | `incident-table` (new `components/portal/incident-table.tsx`) | shadcn `table` themed to tokens, wrapped in `cream-2`/`border` panel radius `16px`. 5-col grid template `100px 1.4fr 1fr 110px 130px`, gap `14px`. Header + rows share the template. Source 845–858. |
| Table header | inline in `incident-table` | Cols: Ref · Resident & type · Reported by · Severity · Status. `12px`/700, uppercase, letter-spacing `.4px`, `muted-2`, pad `13px 22px`, `border` bottom divider. Source 846–848. |
| Incident row (×6) | `incident-row` (inside `incident-table`) | pad `15px 22px`, `align-items:center`, `#F0E9DA` bottom divider. Cells: **Ref** (`i.id`, Newsreader `13px`/600 `muted-2`) · **Resident & type** (resident `14.5px`/600 `ink`; "{type} · {date}" `muted` `12.5px`) · **Reported by** (`i.by`, `13.5px` `muted`) · **Severity** pill (text `i.sev`, colour `i.sevColor`, bg `i.sevTint`, radius pill) · **Status** (`i.status`, `13px`/600, colour `i.statColor`; text-only, no pill). Source 850–856. |

## Data consumed
From `lib/mock-data/incidents.ts` (see 03-data-model.md):
- `getIncidents()` → `Incident[]` (6 rows, source order INC-0432 → INC-0427). Raw fields: `id`, `date`, `resident`, `type`, `severity` (`sev`), `status`, `reportedBy` (`by`). Source `incidentsRaw` lines 1275–1282.
- Derived per row (mirrors `incidents.map` line 1283): `sevColor`/`sevTint` from `severityMeta` (severity scale), `statColor` from status→colour map (`statMeta`). **Not stored** — computed in accessor/helper layer.
  - `severityMeta` (`sevMeta` line 1273): Low sage `#3F5137`/`#E5EBDD` · Moderate amber `#b0894a`/`#EDE6D3` · High rust `#a4432f`/`#F3DAD2`.
  - Status colours (`statMeta` line 1274): Under review `#b0894a` · Resolved `#2C3563` · New `#BE7350` · Actioned `#2C3563`.
- `compKpis` → `Kpi[]` (4): `label`, `value`, `sub`, `color` token. Source lines 1284–1289.

## Variants & states
- **Admin-only** — reachable only as `role === 'admin'`; staff → "Admin only" empty state (no hard guard this phase).
- **Severity-driven styling** — severity pill colour/tint from the severity scale (Low/Moderate/High).
- **Status-driven styling** — status text colour from `statMeta`; Under review = amber, Resolved/Actioned = navy, New = terracotta.
- **Static list** — 6 fixed rows; no empty/loading/pagination state (mock data fixed).
- **Colour never sole signal** — severity pill and status both carry text labels alongside colour.
- Responsive: KPI grid collapses (4→2→1); table wraps in `overflow-x:auto` container below its min width so the 5-col grid never forces body horizontal scroll; sensible stacking on narrow widths.

## Interactions
- **+ Report incident** button — inert this phase (`console`-noop; static button source line 838). No modal/form.
- No row clicks, filters, sorting, or search — table is read-only display (source has no per-row handler).
- Sidebar nav + role toggle come from `PortalLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) panel/cards, `border` (`#E7DECD`) outline + header divider, `#F0E9DA` row divider.
- **Incident severity semantic scale** (01-design-system.md): Low sage `#3F5137`/`#E5EBDD` · Moderate amber `#b0894a`/`#EDE6D3` · High rust `#a4432f`/`#F3DAD2` — referenced by name via `severityMeta`, never hardcoded per row.
- Status colours: navy `#2C3563` (Resolved/Actioned), amber `#b0894a` (Under review), terracotta `#BE7350` (New) — from `statMeta` map.
- Text: `ink` (`#2B2720`) resident names, `muted` (`#5B5347`/`#6b6255`) type/date/reported-by, `muted-2` (`#948B7B`) ref + column heads.
- Accent: `accent` (navy) primary button; `cream` button text.
- KPI value colours: amber `#b0894a`, ink `#2B2720`, terracotta `#BE7350`, navy `#2C3563` (stored per KPI).
- Type: Newsreader H1 `32px`/500, KPI value `30px`, ref `13px`; Instrument Sans body/labels/heads/pills.
- Radius: panel/cards `16px`, button `11px`, severity pill `100px`. Main pad `30px`, `max-width:1180px`.

## Out of scope (this phase)
- **+ Report incident** button — visually present, inert (no report form, no mutation).
- No incident detail drill-down, edit, status change, or resolution workflow.
- No filtering by severity/status, no search, no sort, no pagination.
- Audit-readiness / falls KPIs are static text (no real compliance computation).

## Definition of Done
Beyond global DoD (00-rules §11):
1. 6 `incident-row`s render in source order (INC-0432 → INC-0427) with Ref, Resident, "{type} · {date}", Reported by, severity pill, status text.
2. Severity pill colour/tint from `severityMeta`; status colour from `statMeta` — no raw hex in JSX. Spot-check INC-0427 (High → rust pill) and INC-0431 (Resolved → navy status).
3. Table uses the `100px 1.4fr 1fr 110px 130px` grid template for header + rows; wrapped so it never causes body horizontal scroll.
4. 4 `KpiCard`s render from `compKpis` with per-KPI value colour.
5. All data via `getIncidents()` / `compKpis` accessors — no inline fixtures.
6. Visited as staff → "Admin only" empty state; admin nav shows Incidents item.
