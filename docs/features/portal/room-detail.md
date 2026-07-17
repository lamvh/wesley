# Room detail

- **Route:** `/portal/rooms/[num]` - `app/portal/rooms/[num]/page.tsx`
- **Section:** Portal · **Access:** admin
- **Source:** lines `586–650` (room detail screen) + `1217–1259` (`roomsRaw`, `roomStatusMeta`, `roomSupplyDefs`, `actsByWing`, `mkItem`)
- **Render:** RSC (no client islands - static content + back link)

## Purpose
Admin deep-view of a single room: its status, the resident (or vacancy), today's programme, current supply levels and housekeeping schedule. Reached by clicking a room card on `/portal/rooms`.

## Layout
Single-column body inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Back link** - `‹ All rooms` text button, `muted` `14px`/600, pad-bottom `14px`.
2. **Status header** - `cream-2` bar, `border`, **`border-left:5px` in `statusColor`**, radius `16px`, pad `22px 26px`, flex space-between: wing · room number + care line left, status pill right.
3. **Two-column grid** - `grid-template-columns:1.4fr 1fr`, gap `16px`, margin-top `16px`.
   - **Left col** (`flex-col` gap `16px`): occupied ⇒ resident card + Today's activities; empty ⇒ room-status card with Assign button.
   - **Right col** (`flex-col` gap `16px`): Room supplies card + Housekeeping card.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Back link | `BackLink` (new, `components/portal/back-link.tsx`) | `next/link` to `/portal/rooms`. Label `‹ All rooms`, `muted` `14px`/600 (source `closeRoom`, line 588). Reused by resident detail. |
| Status header | `page.tsx` inline header | Left: "{wing} · Room {num}" Newsreader `30px`/600 + care line (`#7a7163` `14px`). Right: status pill (`statusColor` on `statusTint`, `13px`/600, radius `100px`). Left-border = `statusColor`. |
| Resident card (occupied) | `RoomResidentCard` (new, `components/portal/room-resident-card.tsx`) | `cream-2`, `border`, radius `16px`, pad `22px`. Eyebrow "RESIDENT" (navy-muted `12px`/700 uppercase). 54px square avatar (`colorKey` bg, `20px` initials) + name (`18px`/600) + care line. Diet + mobility pill chips (diet sage, mobility navy tint). `note` paragraph. |
| Today's activities (occupied) | `ActivityList` (new, `components/portal/activity-list.tsx`) | `cream-2` card, pad `22px`. H3 "Today's activities" Newsreader `19px`/600. Rows = gold dot (`bronze` `#B88A34`) + activity text (`ink-soft` `14px`), each `padding:11px 0`, bottom border `border-2`. From `room.activities` (by wing). |
| Room-status card (empty) | `RoomStatusCard` (new, `components/portal/room-status-card.tsx`) | Replaces resident card when vacant. Eyebrow "ROOM STATUS", `note` paragraph (`15px`), then **Assign a resident** button (`accent` fill, cream text, radius `11px`). |
| Room supplies card | `page.tsx` inline + `SupplyRow` | `cream-2` card, pad `22px`. Header: H3 "Room supplies" + `Stock` link (`bronze-text` `13px`/600) → `/portal/stock`. Occupied ⇒ list of `SupplyRow`; empty ⇒ "No supplies allocated while the room is {status}." (`muted-2` `13.5px`). |
| Supply row (×N, occupied) | `SupplyRow` (new, `components/portal/supply-row.tsx`) | Flex row, `padding:11px 0`, bottom border `#F0E9DA`: status dot (`stockStatus` color) + name (`13.5px`/600) & "Par {par} {unit}" (`muted-2` `11.5px`) + qty (`13px`/600) + status pill (`stockStatus` color/tint, radius `100px`). |
| Housekeeping card | `page.tsx` inline | `cream-2` card, pad `22px`. H3 "Housekeeping" Newsreader `19px`/600 + `house` line (`ink-soft` `13.5px`, line-height `1.55`). |

## Data consumed
From `lib/mock-data/rooms.ts` via **`getRoomByNum(num)`** → `Room` (mirrors `roomsRaw`, lines 1230–1246; `[num]` param = room number e.g. `05`). Fields used:
- `num`, `wing`, `status` - header title + status pill + left-border.
- `careType` / care line - e.g. "Rest home" shown in header + resident card.
- `resident?` - `{ name, initials, colorKey, diet, mobility }`; drives occupied resident card. `note` also from room.
- `note` - resident-card paragraph (occupied) OR room-status paragraph (empty).
- `activities?` - `string[]` by wing (`actsByWing`, lines 1224–1228), occupied only, e.g. Rātā → Garden group · 9:30am / Gentle exercise · 11:00am / Choir & singalong · 2:00pm.
- `supplies?` - `SupplyItem[]` from `roomSupplyDefs` (line 1229: briefs 18/24, bed pads 30/30, gloves 3/10, wipes 12/12), occupied only.
- `house` - housekeeping line.

Derived (helpers, not stored):
- `roomStatusMeta(status)` → `{ colorToken, tintToken }` (room-status scale) for header pill + left-border.
- `stockStatus(qty, par)` → `In stock | Low | Reorder` + pct/color/tint (ratio ≥1 / ≥0.5 / <0.5) for each `SupplyRow`.
- `initials(name)`, care-tier label from wing.

## Variants & states
- **Access:** admin-only; staff → "Admin only" empty state (no hard guard this phase).
- **Occupied** (`resident` present): left col = resident card + Today's activities; right supplies card lists `SupplyRow`s. (e.g. Rātā 05, 07, 12, 15; Kōwhai 18–24; Tōtara 30–33.)
- **Empty / Available** (e.g. Rātā 09, Kōwhai 20, Tōtara 32): left col = room-status card with `note` + **Assign a resident**; supplies card shows "No supplies allocated while the room is Available."
- **Maintenance** (e.g. Rātā 03): same empty layout; status pill/border rust; note describes the repair; supplies message reads "…while the room is Maintenance."
- **Respite:** treated as empty variant unless a resident is attached (gold status scale).
- **Status-driven styling:** header left-border (`5px`) + status pill colored from the room-status scale; supply pills from the stock scale.
- Responsive: `1.4fr 1fr` grid stacks to single column on narrow widths; no horizontal body scroll.

## Interactions
- **`‹ All rooms`** back link → `/portal/rooms`.
- **`Stock`** link (supplies card header) → `/portal/stock` (source `navStock`, line 627).
- **Assign a resident** button (empty variant) - visually present, **inert** this phase.
- No supply editing, quantity adjustment, or activity editing.

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards, `cream` field none, `border` (`#E7DECD`) outlines, inner dividers `border-2` (`#EEE6D6`) / `#F0E9DA`.
- **Room-status semantic scale** for header left-border + status pill (Occupied sage · Respite gold · Available navy-muted · Maintenance rust).
- **Stock / alert level scale** for supply dots + pills: In stock sage `#6E875E`/`#E5EBDD` · Low amber `#b0894a`/`#EDE6D3` · Reorder terracotta `#BE7350`/`#F1E0D3`.
- Diet chip sage (`#3F5137`/`#E5EBDD`), mobility chip navy tint (`#4A5488`/`#E4E6F2`); activity dot `bronze` `#B88A34`.
- Accent: `accent` (navy default) on Assign button + `bronze-text` on Stock link.
- Type: Newsreader header `30px`/600, card H3 `19px`/600, resident name `18px`/600; Instrument Sans body/meta/pills. Radius cards `16px`, button `11px`, pills `100px`. `max-width:1180px`.

## Out of scope (this phase)
- **Assign a resident** button inert - no admission/assignment flow.
- Supplies are read-only - no reorder, no editing qty/par (the `Stock` link only navigates).
- Activities are read-only labels - no scheduling.
- No breadcrumb beyond the single back link; `[num]` not validated against real data (mock lookup only).

## Definition of Done
Beyond global DoD (00-rules §11):
1. Status header shows wing · room number, care line, status pill, and a `5px` left-border colored from the room-status scale (no raw hex).
2. Occupied room: resident card (avatar, name, diet + mobility chips, note) + Today's activities list render; supplies card lists `SupplyRow`s with correct `stockStatus` dot/pill.
3. Empty/Available/Maintenance room: room-status card with note + inert Assign button renders; supplies card shows the "No supplies allocated while the room is {status}." message with the live status word.
4. Housekeeping card shows `house` line.
5. `‹ All rooms` → `/portal/rooms`; `Stock` → `/portal/stock`.
6. All content via `getRoomByNum(num)` + helpers - no inline fixtures or raw hex.
