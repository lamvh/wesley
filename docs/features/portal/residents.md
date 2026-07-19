# Residents

- **Route:** `/portal/residents` - `app/portal/residents/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `720–747` (resident list screen) + `1103–1121` (`residentsRaw`, `wingTier`, `careMeta`)
- **Render:** RSC + client island: **tier filter pills** (local UI state, visual only)

## Purpose
Directory of everyone in care, shown as a grid of resident cards keyed by room. Both admin and staff use it to find a resident and open their profile.

## Layout
Single-column body inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Header row** - flex space-between (`flex-wrap`, gap `16px`, align end): title + subtitle left; tier filter pills + `+ Admit` right.
2. **Resident grid** - 3-column grid (`repeat(3,1fr)`, gap `14px`, margin-top `22px`) of resident cards.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Page header | `page.tsx` inline header | H1 "Residents" Newsreader `32px`/500; subtitle `muted` `15px` "51 in care · 51 rooms occupied · 3 rooms available". |
| Tier filter pills | `TierFilterPills` (new client, `components/portal/tier-filter-pills.tsx`) | Pill group in a `cream-3`-ish rounded container (`#EDE4D2`, `border #E0D5C0`, radius `100px`, pad `4px`): `All` (active - navy fill, cream text) · `VIP` · `Premium` · `Normal` (inactive - `muted` `13px`/600). Holds local active state; **visual only** - does not filter the grid this phase. |
| Admit button | `Button` (shadcn primary) | `accent` fill, cream text, radius `11px`, pad `9px 16px`, `14px`/600. Label `+ Admit`. Inert. |
| Resident grid | `page.tsx` section | `repeat(3,1fr)` gap `14px`. Maps `getResidents()` → `ResidentCard`. |
| Resident card (×N) | `ResidentCard` (new, `components/portal/resident-card.tsx`) | `cream-2`, `border`, radius `16px`, pad `18px`, `cursor:pointer`. Top: 52px square avatar (`colorKey` bg, `20px` initials) + name (`16px`/600) & "Room {room}" (`muted-2` `13px`). Bottom row (margin-top `15px`, space-between): care-tier badge (`careColor` on `careTint`) left + diet (`muted-2` `12.5px`) right. |

## Data consumed
**Live from Supabase** via **`getResidents()`** in `lib/data/residents.ts` (async, RSC, runs under the signed-in user's session → RLS `residents_read`). Rows map snake_case DB columns → the `Resident` domain type; ordered by `created_at`. The detail route uses `getResidentBySlug(slug)`. (The mock `lib/mock-data/residents.ts` remains only for screens not yet migrated, e.g. `meal-report`.) Fields used per card:
- `slug` - `slugify(name)`, the `[id]` route param (e.g. `margaret-whitcombe`).
- `name` - card title.
- `room` - room number, shown as "Room {room}".
- `avatar` - initials for the avatar tile.
- `colorKey` - avatar palette entry (bg).
- `diet` - meta text bottom-right.

`wing`/`careType` were removed from the `Resident` model (2026-07-20, see "Design parity" #3–4 below) - no per-resident wing or care-tier badge is derived or shown anymore. `Room` (the rooms screen) still carries its own `wing`/`careType`, unrelated to this change.

## Variants & states
- **No role variance** - identical for admin and staff (access both).
- **Care-tier badge** (care-tier scale, from wing): Normal → sage `#3F5137`/`#E5EBDD` · Premium → navy `#2C3563`/`#E4E6F2` · VIP → gold `#8A6516`/`#F3E8CE`. Paired with the tier text so color isn't the sole signal.
- **Tier filter pills:** `All` active by default (navy pill); others inactive. Clicking changes the active pill's styling only - **the grid does not filter** this phase (visual state).
- **Avatar color** per resident from `colorKey` (avatar palette).
- **DB-backed list** - read live from Supabase; the route's `loading.tsx` skeleton covers the fetch. No client-side filter/empty state yet.
- **Hover:** card `border-color` darkens `#C9BCA0` + `box-shadow:0 8px 20px -12px rgba(0,0,0,.18)` (source `style-hover`, line 735).
- Responsive: 3-col grid collapses to 2/1 on narrow widths; pill group + Admit stack under the title; no horizontal body scroll.

## Interactions
- **Resident card click** → navigates to `/portal/residents/{slug}` (source `r.open` modal state, line 735; here a real `next/link`).
- **Tier filter pill click** → sets active pill (client state) - **inert filter** this phase (no grid change).
- **`+ Admit`** → `/portal/residents/new` (create form). **Edit** (on the detail page) → `/portal/residents/{slug}/edit`. Both render `ResidentForm` (client, `useActionState`) backed by the `saveResident` server action; **Remove resident** (edit page) → `deleteResident`. All write to Supabase under RLS and revalidate the list/detail.

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards; pill container `#EDE4D2` / border `#E0D5C0`; `border` (`#E7DECD`) card outlines.
- **Care-tier semantic scale** (01-design-system) for tier badges - never hardcoded per card.
- Accent: `navy` active-pill fill + `accent` (navy default) Admit button; `cream` text on both.
- Text: `ink` name, `muted` subtitle, `muted-2` room + diet meta.
- Type: Newsreader H1 `32px`/500, avatar initials `20px`; Instrument Sans name `16px`/600, meta/badges. Radius card `16px`, avatar tile `14px`, pills/badge `100px`, button `11px`. Grid gap `14px`; `max-width:1180px`.

## Create / edit / delete
- Routes: `residents/new/page.tsx` (Admit) and `residents/[id]/edit/page.tsx` (Edit) - both render `components/portal/residents/resident-form.tsx`.
- Server actions: `lib/actions/residents.ts` - `saveResident` (insert when no slug / update when slug present; validates name/room/age - room must match `getRooms()`; slug = `slugify(name)`, avatar = `initials(name)`, colour derived from name) and `deleteResident`. Writes run under the user session (RLS `residents_write`).
- Form fields: name*, preferred name, room* (`<select>` from `getRooms()`), age, diet, mobility, GP, care flags (comma-separated), notes. Errors surface inline.

## Out of scope (this phase)
- **Tier filter pills** are visual only - clicking restyles the active pill but does not filter the resident grid.
- No search of residents (search lives in the topbar, out of scope this phase).
- No sort/pagination - all residents render.

## Definition of Done
Beyond global DoD (00-rules §11):
1. Header shows H1 "Residents" + the "51 in care · …" subtitle, tier pills, and `+ Admit` button.
2. Resident grid renders one `ResidentCard` per `getResidents()` entry in source order, each with avatar (colorKey), name, "Room {room}", and diet.
3. Each card navigates to `/portal/residents/{slug}`.
4. Tier pills toggle active styling (client) but leave the grid unfiltered; `+ Admit` opens the create form.
5. All content via `getResidents()` (Supabase) + care-tier helpers - no inline fixtures.
6. Admit/Edit persist to Supabase and redirect to the resident; Remove deletes and returns to the list; the directory reflects changes (revalidated).

## Design parity — open items (audited 2026-07-18)

Compared CRUD against design v1.0 (`Victoria at Mt Eden.dc.html`, 16 Jul). Code implements full CRUD on Supabase (create/update/delete + validation + RLS) beyond the mock design; care flags are captured for real (design hardcodes them). Open differences, **reported only — not changed** (pending decision):

| # | Item | Design | Code | Note |
|---|------|--------|------|------|
| 1 | Room field | `<select>` from real rooms ("every resident linked to one room") | ~~free-text input~~ **`<select>` from `getRooms()`, required — 2026-07-20** | resolved - see below |
| 2 | Detail room card | room card (status/type/building/shared) + "View room details →" link | ~~absent~~ **`RoomCard` added — 2026-07-20** | resolved - see below |
| 3 | Wing | not in form (derived from room) | ~~explicit required "Wing" select~~ **removed 2026-07-20** | resolved - see below |
| 4 | Care type | not in form (badge = tier, room-derived) | ~~required "Care type" select~~ **removed 2026-07-20** | resolved - see below |
| 5 | Tier label | "Standard" | ~~"Normal"~~ **"Standard" in `tier-filter-pills.tsx` — 2026-07-20** | resolved (pill label only; `CareTier` type value stays `"Normal"`, unrelated) |
| 6 | Tier filter pills | filter by tier | visual-only ("does not filter this phase") | both incomplete, unchanged |
| 7 | Card subtitle | "Room {room}" | "Room {room}" | resolved (matches, see Design v1.2 below) |
| 8 | Detail facts | Age/Care level/Mobility/Diet/GP | Age/Mobility/Diet/GP (tier as badge) | "Care level" row omitted |
| 9 | Remove placement | detail header | edit page (with confirm) | UX-only |

Only items 6, 8, 9 remain open/unchanged (not requested). Items 1–5 resolved 2026-07-20 — see below.

## Design v1.2 (18 Jul 2026) — implemented 2026-07-18

Pulled the updated resident screens from Claude Design (`Victoria at Mt Eden.dc.html`, now 18 Jul / detail v1.2; the earlier local copy was 16 Jul v1.0). Changes applied:

- **Care-tier badge removed** (design 17 Jul, "Care level pill & row removed"). Dropped the tier pill from `resident-profile-header.tsx` (detail) and `resident-card.tsx` (directory). The "Care level" fact row was already absent in code. `careTier`/`careTierMeta`/`cn` imports removed from both. The tier concept still backs the list filter pills (`tier-filter-pills.tsx`, visual-only).
- **Name repositioned** (design 18 Jul, "name moved onto the card"). Detail banner shortened (h-24 → h-[84px]); only the avatar overlaps the banner (`-mt-[44px]`); the name now sits on the card body (`pt-3`) instead of the whole identity row being pulled up over the banner.
- **Card subtitle** "{wing} · Room {room}" → "Room {room}" (matches design directory card).

Prior parity items #1–4 (room-as-select, detail room card, wing/careType model) remain **reported-only, not changed**. Item #5 (tier label "Normal" vs "Standard") now only surfaces in the filter pills, since per-resident tier badges are gone. Item #8 (Care level fact row) is resolved — neither design nor code shows it.

## Wing / care-type removal (2026-07-20)

Master plan luồng C, items 3–4: `wing` and `care_type` were a deliberate code extension over the design (which derives wing/tier from room, not a standalone field) - confirmed no longer needed and removed outright, not just hidden:

- `Resident` type (`types/domain.ts`) - dropped `wing`/`careType` fields. `Room` keeps its own `wing`/`careType` (rooms screen, unrelated).
- `resident-form.tsx` - removed the "Wing" and "Care type" required selects.
- `lib/actions/residents.ts` (`saveResident`) - removed wing/care-type validation; no longer writes those columns.
- `lib/data/residents.ts` - stopped selecting/mapping `wing`/`care_type`.
- `lib/mock-data/residents.ts` + `meal-report.ts` - seed data and the meal-report room label ("{wing} {room}" → `{room}`) updated to match.
- `resident-profile-header.tsx` - detail subtitle "Prefers "{pref}" · {wing} · Room {room}" → "Prefers "{pref}" · Room {room}".
- `scripts/db/emit-core-seed-sql.mts` + `seed-core-schema.mts` - seed inserts no longer write `wing`/`care_type` on `residents`.

DB columns `residents.wing`/`residents.care_type` are left in place (already nullable, `0001_core_schema.sql`) - no migration needed; existing rows keep whatever value they had, new/edited rows just leave them null. Dropping the columns outright is a follow-up if desired, not required for this change.

## Room select + detail room card + tier label (2026-07-20)

Master plan luồng C, items 1/2/5 - all three decided "do it" (not just reported):

- **C1 - Room field is now a required `<select>`** (`resident-form.tsx`), populated from `getRooms()` (`lib/mock-data/rooms.ts` - rooms are still mock, no `rooms` table in Supabase yet, so "real rooms" means the app's canonical room list, not free text). Options: "Room {num} — {wing}", one per known room, any status (no availability filtering - a resident's own current room needs to stay selectable when editing). `saveResident` (`lib/actions/residents.ts`) now rejects any room not in `getRooms()`.
- **C2 - Detail page gained a `RoomCard`** (`components/portal/residents/room-card.tsx`), the third card in the `About / Care flags / Room` row on the resident detail page. Looks up the resident's room via `getRoomByNum`; renders status badge (`roomStatusMeta`), "Room {num}", "{careType} · Wesley", "Private room" (the data model has one resident per room - no room-sharing concept exists to report beyond that), and a "View room details →" link to `/portal/rooms/{num}`. Renders nothing if the room number doesn't resolve (defends against pre-C1 residents whose free-text room doesn't match a real room).
- **C5 - Tier filter pills label "Normal" → "Standard"** (`tier-filter-pills.tsx`), display-only. The underlying `CareTier` type (`types/domain.ts`) still has the value `"Normal"` - only the pill's rendered text changed, not the domain model.

`tsc --noEmit`, eslint, and `next build` all clean after these changes.
