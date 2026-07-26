# Rooms

- **Route:** `/portal/rooms` - `app/portal/rooms/page.tsx`
- **Section:** Portal · **Access:** admin
- **Source:** lines `651–687` (room list screen) + `1217–1270` (`roomsRaw`, `roomStatusMeta`, `roomKpis`, `roomWings` data)
- **Render:** RSC shell + one client island (`rooms-register-view.tsx`) for the per-home tabs; cards are link-navigated

## Purpose
Admin overview of every room in **both homes**, tying each room to its resident and status. Used by the Facility Manager to see occupancy and spot available/maintenance rooms.

Two things the design source got wrong for the real data: rooms are **not** grouped by wing (wings were a design-source invention, dropped project-wide), and there is **more than one home**. Wesley and The Lodge each have their own register and their room numbers overlap - both have a 3A and a 5A - so the screen shows one home at a time behind a tab rather than a single merged list.

## Layout
Single-column body inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Page header row** - flex, title/subtitle left + `+ Manage rooms` button right (`flex-wrap`, gap `16px`, align end).
2. **Home tabs** - pill row (margin-top `22px`), one pill per building with its room count; Wesley first.
3. **KPI row** - 4-column grid (`repeat(4,1fr)`, gap `16px`) of room KPI tiles **for the active home**.
4. **Room grid** - flat 4-column grid of room cards in register order (`sort_order`), no wing grouping.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Page header | `page.tsx` inline header | H1 "Rooms" Newsreader `32px`/500; subtitle `muted` `15px` "Every room ties together its resident, supplies and daily programme". `+ Manage rooms` = `Button` (shadcn primary, `accent` fill, cream text, radius `11px`) - inert. |
| KPI tiles (×4) | `KpiCard` (shared `components/shared/kpi-card.tsx`) | `cream-2` surface, `border`, radius `16px`, pad `18px 20px`. Label `muted-2` `13px`/600; value Newsreader `30px` in the tile's semantic color; sub `muted-2` `12.5px`. Fed by `roomKpis`. |
| Home tabs | `rooms-register-view.tsx` (client) | Pill row in the same style as the residents directory tabs: `cream-3` track, `field` border, active pill `navy`/cream, each pill = building name + room count. Holds the active building in local state and filters the rooms already loaded - no second round trip. |
| Room card (×N) | `RoomCard` (new, `components/portal/room-card.tsx`) | `cream-2` surface, `border`, **`border-left:4px` in `statusColor`**, radius `14px`, pad `15px 16px`, `cursor:pointer`. Header row: "Room {num}" Newsreader `20px`/600 + care-tier label (`muted-2` `11.5px`) left; status pill (`statusColor` text on `statusTint`, radius `100px`) right. Occupied → resident chip; empty → note line. |
| Resident chip (occupied) | inline in `RoomCard` | 34px round avatar (`color` bg, white initials) + resident name (`ink`, `13.5px`/600, truncate) + diet (`muted-2` `11.5px`). Margin-top `13px`. **One chip per occupant** - The Lodge's 10B holds a couple, so the card stacks two chips. |
| Empty note (non-occupied) | inline in `RoomCard` | `note` text, `muted` `12.5px`, line-height `1.4`, margin-top `13px`. |

## Data consumed
`getRoomRecords()` (`lib/data/rooms.ts`) → `RoomRecord[]` read live from Supabase `rooms`, for **both** homes, plus `listBuildings()` for the tab labels. Fields per room:
- `buildingId` - `buildings.id`; part of the room's identity, not decoration. Drives the tab filter and the `?home=` on the detail link.
- `num` - room number (card title + `[num]` route param).
- `status` - `Occupied | Available | Maintenance | Respite`; drives left-border + status pill via `roomStatusMeta`.
- `tier` - `""` until the home sets one; the tier pill is simply absent until then (wings/care types no longer derive it).
- `occupants` - `RoomOccupant[]`, resolved from `residents.room`. Empty ⇒ the card shows `note` / "Vacant".
- `note` - shown in the vacant-state card only.

**The join key is (building, room), not room.** Both registers contain a 3A and a 5A; matching on the number alone showed one home's resident in the other home's room. Occupancy is derived from `residents.room` rather than stored on the room, so the two can never disagree - moving a resident is a single write.

Derived in the client island, per active home (not stored, so the tiles can't drift from the grid):
- **KPI tiles** - Occupied (`occupants.length > 0`), Available now, Maintenance, Total rooms, each counted from the rooms of the active home only. "Occupied of total" is meaningless summed across two homes.

Ordering: `sort_order` within a home, so "3A" follows "3" and Wesley's 125-134 block lands last; The Lodge runs its B block then its A block. A text sort would give 1, 10, 11, 125, 12, …

## Variants & states
- **Access:** admin-only. Visited as staff → simple "Admin only" empty state (no hard guard/redirect this phase; per 02-architecture role model).
- **Card status styling** (room-status scale, driven by `status`): Occupied → sage border/pill; Respite → gold; Available → navy-muted; Maintenance → rust. Color paired with the status text label so color is never the sole signal.
- **Occupied vs empty card body:** occupied ⇒ resident chip (avatar + name + diet); Available/Maintenance/Respite-with-no-resident ⇒ `note` line, no chip.
- **KPI value color** varies per tile (ink / navy-muted / gold / rust) from `roomKpis[].color`.
- **Hover:** room card raises `box-shadow:0 8px 20px -12px rgba(0,0,0,.18)` + `border-color` darkens (source `style-hover`, line 667).
- **Empty home:** a building with no rooms in the register renders a dashed empty panel instead of tiles + grid.
- Responsive: KPI grid + room grid reflow (4 → 3 → 2 → 1 columns); tab pills wrap; no horizontal body scroll.

## Interactions
- **Room card click** → navigates to `/portal/rooms/{num}?home={buildingId}`. The query param is required to identify the room: `/portal/rooms/3A` alone is ambiguous across the two registers, and resolves to Wesley for back-compatibility with older links.
- **Home tab click** → filters the grid + KPIs client-side; no navigation, no refetch.
- **`+ Manage rooms`** button - visually present, **inert** this phase (no room CRUD).
- Sidebar/topbar interactions belong to `PortalLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards/tiles, `border` (`#E7DECD`) outlines, inner divider none.
- **Room-status semantic scale** (01-design-system): Occupied sage `#3F5137`/`#E5EBDD` · Respite gold `#8A6516`/`#F3E8CE` · Available navy-muted `#4A5488`/`#E4E6F2` · Maintenance rust `#93502F`/`#F1E0D3` - border-left + status pill only, never hardcoded per card.
- KPI value colors: `ink` `#2B2720`, navy-muted `#4A5488`, gold `#8A6516`, rust `#93502F`.
- Accent: `accent` (defaults `navy` `#2C3563`) on `+ Manage rooms` button; cream text.
- Text: `ink` titles, `muted`/`muted-2` subtitles/meta.
- Type: Newsreader H1 `32px`/500, card title `20px`/600, KPI value `30px`; Instrument Sans body/meta/pills.
- Radius: KPI/wing-card `16px`, room card `14px`, button `11px`, pills `100px`. Grid gaps `12–16px`; `max-width:1180px`.

## Out of scope (this phase)
- **`+ Manage rooms`** button inert - no room create/edit/delete.
- No search, filter, or sort of rooms beyond the per-home tab.
- No pagination - every room of the active home renders.
- The tab is view-only state: it is not in the URL, so it does not survive a reload or a back-navigation from a room detail.

## Definition of Done
Beyond global DoD (00-rules §11):
1. One tab per building, Wesley first, each with its room count; switching tabs swaps both the KPI tiles and the grid.
2. 4 KPI tiles render in order (Occupied, Available now, Maintenance, Total rooms) counted from the **active home's** rooms.
3. Every room card shows a left-border + status pill from the room-status scale (no raw hex), and either a chip per occupant or a note line.
4. A room holding two residents (The Lodge 10B) shows both chips - neither is dropped.
5. Wesley's 3A and The Lodge's 3A each show their own resident.
6. Each card navigates to `/portal/rooms/{num}?home={buildingId}`, and the detail page names the home.
7. All content via `getRoomRecords()` / `listBuildings()` - no inline fixtures, no mock rooms.
8. Visited as staff, renders "Admin only" state, not the room list.
