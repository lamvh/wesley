# Rooms

- **Route:** `/portal/rooms` — `app/portal/rooms/page.tsx`
- **Section:** Portal · **Access:** admin
- **Source:** lines `651–687` (room list screen) + `1217–1270` (`roomsRaw`, `roomStatusMeta`, `roomKpis`, `roomWings` data)
- **Render:** RSC (no client islands — static content + link-navigated cards)

## Purpose
Admin overview of every room in the home, grouping each room by wing and tying it to its resident, status and daily programme at a glance. Used by the Facility Manager to see occupancy and spot available/maintenance rooms.

## Layout
Single-column body inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Page header row** — flex, title/subtitle left + `+ Manage rooms` button right (`flex-wrap`, gap `16px`, align end).
2. **KPI row** — 4-column grid (`repeat(4,1fr)`, gap `16px`, margin-top `22px`) of room KPI tiles.
3. **Wing groups** — vertical stack (margin-top `22px`) of 3 wing sections, each a wing heading + auto-fill grid of room cards.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Page header | `page.tsx` inline header | H1 "Rooms" Newsreader `32px`/500; subtitle `muted` `15px` "Every room ties together its resident, supplies and daily programme". `+ Manage rooms` = `Button` (shadcn primary, `accent` fill, cream text, radius `11px`) — inert. |
| KPI tiles (×4) | `KpiCard` (shared `components/shared/kpi-card.tsx`) | `cream-2` surface, `border`, radius `16px`, pad `18px 20px`. Label `muted-2` `13px`/600; value Newsreader `30px` in the tile's semantic color; sub `muted-2` `12.5px`. Fed by `roomKpis`. |
| Wing group (×3) | `WingGroup` (new, `components/portal/wing-group.tsx`) | Heading = wing name Newsreader `19px`/600 + `{count} rooms` meta (`muted-2` `12.5px`). Body = responsive grid `repeat(auto-fill,minmax(238px,1fr))`, gap `12px`. Maps `w.items` → `RoomCard`. |
| Room card (×N) | `RoomCard` (new, `components/portal/room-card.tsx`) | `cream-2` surface, `border`, **`border-left:4px` in `statusColor`**, radius `14px`, pad `15px 16px`, `cursor:pointer`. Header row: "Room {num}" Newsreader `20px`/600 + care-tier label (`muted-2` `11.5px`) left; status pill (`statusColor` text on `statusTint`, radius `100px`) right. Occupied → resident chip; empty → note line. |
| Resident chip (occupied) | inline in `RoomCard` | 34px round avatar (`colorKey` bg, white initials) + resident name (`ink`, `13.5px`/600, truncate) + diet (`muted-2` `11.5px`). Margin-top `13px`. |
| Empty note (non-occupied) | inline in `RoomCard` | `note` text, `muted` `12.5px`, line-height `1.4`, margin-top `13px`. |

## Data consumed
From `lib/mock-data/rooms.ts` via **`getRooms()`** → `Room[]` (mirrors `roomsRaw`, lines 1230–1246) grouped for display, plus derived KPI/wing accessors. Fields used per room:
- `num` — room number (card title + `[num]` route param).
- `wing` — `Rātā | Kōwhai | Tōtara`; drives grouping + care-tier label.
- `status` — `Occupied | Available | Maintenance | Respite`; drives left-border + status pill via `roomStatusMeta`.
- `resident?` — `{ name, initials, colorKey, diet }`; present ⇒ occupied chip. Absent ⇒ empty.
- `note` — shown in the empty-state card only.

Derived (helpers / accessor layer, not stored):
- **`roomKpis`** (lines 1260–1265) — 4 tiles: Occupied `50` (of 54 suites, `ink`), Available now `2` (`navy-muted`), VIP suites `12` (`gold`, Tōtara fully booked), Maintenance `1` (`rust`, Rātā 03 rail repair). Exposed via `getRoomKpis()`.
- **`roomWings`** (lines 1266–1270) — `[Rātā · Normal, Kōwhai · Premium, Tōtara · VIP]`, each `{ name, items: rooms filtered by wing, count }`. Exposed via `getRoomWings()`.
- Care-tier label from `careTier(wing)` (`{ Rātā:Normal, Kōwhai:Premium, Tōtara:VIP }`).
- `roomStatusMeta(status)` → `{ colorToken, tintToken }` from the room-status semantic scale.

## Variants & states
- **Access:** admin-only. Visited as staff → simple "Admin only" empty state (no hard guard/redirect this phase; per 02-architecture role model).
- **Card status styling** (room-status scale, driven by `status`): Occupied → sage border/pill; Respite → gold; Available → navy-muted; Maintenance → rust. Color paired with the status text label so color is never the sole signal.
- **Occupied vs empty card body:** occupied ⇒ resident chip (avatar + name + diet); Available/Maintenance/Respite-with-no-resident ⇒ `note` line, no chip.
- **KPI value color** varies per tile (ink / navy-muted / gold / rust) from `roomKpis[].color`.
- **Hover:** room card raises `box-shadow:0 8px 20px -12px rgba(0,0,0,.18)` + `border-color` darkens (source `style-hover`, line 667).
- Responsive: KPI grid + wing card grids reflow via `auto-fill minmax(238px,1fr)`; no horizontal body scroll; tiles stack on narrow widths.

## Interactions
- **Room card click** → navigates to `/portal/rooms/{num}` (source uses `rm.open` modal state, line 667; here a real `next/link` to the nested route). Each card links to its own room number.
- **`+ Manage rooms`** button — visually present, **inert** this phase (no room CRUD).
- Sidebar/topbar interactions belong to `PortalLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards/tiles, `border` (`#E7DECD`) outlines, inner divider none.
- **Room-status semantic scale** (01-design-system): Occupied sage `#3F5137`/`#E5EBDD` · Respite gold `#8A6516`/`#F3E8CE` · Available navy-muted `#4A5488`/`#E4E6F2` · Maintenance rust `#93502F`/`#F1E0D3` — border-left + status pill only, never hardcoded per card.
- KPI value colors: `ink` `#2B2720`, navy-muted `#4A5488`, gold `#8A6516`, rust `#93502F`.
- Accent: `accent` (defaults `navy` `#2C3563`) on `+ Manage rooms` button; cream text.
- Text: `ink` titles, `muted`/`muted-2` subtitles/meta.
- Type: Newsreader H1 `32px`/500, card title `20px`/600, wing heading `19px`/600, KPI value `30px`; Instrument Sans body/meta/pills.
- Radius: KPI/wing-card `16px`, room card `14px`, button `11px`, pills `100px`. Grid gaps `12–16px`; `max-width:1180px`.

## Out of scope (this phase)
- **`+ Manage rooms`** button inert — no room create/edit/delete.
- No search, filter, or sort of rooms (wing grouping is static).
- No live occupancy computation — KPI values are static mock figures (`roomKpis`), not derived from `roomsRaw` counts.
- No pagination — all rooms render in their wing groups.

## Definition of Done
Beyond global DoD (00-rules §11):
1. 4 KPI tiles render from `getRoomKpis()` in order (Occupied, Available now, VIP suites, Maintenance) with correct per-tile value colors.
2. Exactly 3 wing groups (Rātā · Normal, Kōwhai · Premium, Tōtara · VIP) each showing its filtered rooms + `{count} rooms` meta.
3. Every room card shows a left-border + status pill from the room-status scale (no raw hex), and either a resident chip (occupied) or a note line (empty).
4. Each card navigates to `/portal/rooms/{num}`.
5. All content via `getRooms()` / `getRoomKpis()` / `getRoomWings()` — no inline fixtures.
6. Visited as staff, renders "Admin only" state, not the room list.
