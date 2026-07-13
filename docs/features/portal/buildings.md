# Buildings

- **Route:** `/portal/buildings` — `app/portal/buildings/page.tsx`
- **Section:** Portal · **Access:** admin only
- **Source:** `.design-src/victoria-all-screens-v3.html` lines 1019–1051 (screen), 1519–1527 + 1904–1913 (data), 519–527 (topbar switcher)
- **Render:** RSC page → client `BuildingsView` (reads/writes the shared building selection)

## Purpose
Manage the group's care homes (multi-site). Each building card shows capacity, occupancy, staff and wings; selecting one sets the **active building** used across the portal (topbar switcher + Stock header).

## Layout
Header (title + Add building) → 2-col grid of building cards.

## Sections & components
| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline | "Buildings" + **+ Add building** (inert) |
| Building card | `building-card` | avatar tile, name, full+suburb, "Viewing" badge when active; 3 stats (Suites / Occupancy% / Staff); wings list; site manager + "View this site" (sets active) |

## Data consumed
- `getBuildings()` → `Building[]`; `occupancyPct(b)`; active id from `useBuilding()` (BuildingProvider).

## Variants & states
- Active building highlighted (colored border + "Viewing" badge). "View this site" / card click → `setBuildingId`.
- Shared selection also drives the **topbar `BuildingSwitch`** (admin) and the Stock header ("{building} · inventory…").

## Interactions
- Select building (card / "View this site") — client state via context. Add building — inert.

## Tokens
Per-building `color`/`tint` are data (inline style on the avatar/border, sanctioned). Card surfaces `bg-cream-2`, `border-line`; stats `font-serif`; occupancy number `text-sage`.

## Out of scope (this phase)
Adding/editing buildings, per-building data scoping of other screens (selection is visual only this phase).

## Definition of Done
Both buildings render; selecting one updates the active state everywhere it's shown (cards + topbar); admin-only; tokens only; `tsc`/`lint`/`build` clean.

## Future DB notes
`buildings` table (see 03-data-model.md → "Buildings / multi-site"): `id, name, full_name, suburb, mgr_user_id, color`. Wings, suites, occupancy, staff become derived counts (join residents/rooms/staff filtered by `building_id`). The active building becomes a query filter (`where building_id = ?`) and, with auth, a scoping dimension on RLS. Every care/ops table gains a `building_id` FK.
