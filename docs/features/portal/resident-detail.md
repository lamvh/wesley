# Resident detail

- **Route:** `/portal/residents/[id]` — `app/portal/residents/[id]/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `694–719` (resident detail screen) + `1103–1121` (`residentsRaw`, `wingTier`, `careMeta`)
- **Render:** RSC (no client islands — static profile + back link)

## Purpose
Full profile of a single resident: identity, wing/room, care tier, key facts and care flags. Both admin and staff reach it by clicking a resident card on `/portal/residents`.

## Layout
Single-column body inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Back link** — `‹ All residents` text button, `muted` `14px`/600, pad-bottom `14px`.
2. **Profile card** — `cream-2`, `border`, radius `18px`, `overflow:hidden`, containing:
   - **Gradient banner** — `96px` tall, `linear-gradient(90deg, {colorKey}, navy)`.
   - **Body** (pad `0 28px 26px`, pulled up `-42px`):
     - **Header row** — avatar (overlapping banner) + name/prefs + care-tier badge.
     - **Stat tiles** — 4-column grid (`repeat(4,1fr)`, gap `14px`, margin-top `24px`).
     - **About + Care flags** — 2-column grid (`1fr 1fr`, gap `16px`, margin-top `16px`).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Back link | `BackLink` (shared with room detail, `components/portal/back-link.tsx`) | `next/link` to `/portal/residents`. Label `‹ All residents` (source `closeResident`, line 697). |
| Profile header | `ResidentProfileHeader` (new, `components/portal/resident-profile-header.tsx`) | Gradient banner (`colorKey` → `navy`, `96px`). 88px square avatar (`colorKey` bg, `34px` initials, `4px` cream border) overlapping banner `-42px`. Name Newsreader `29px`/600 + "Prefers "{pref}" · {wing} · Room {room}" (`#7a7163` `14.5px`). Care-tier badge right (radius `100px`). |
| Stat tile (×4) | `StatTile` (new, `components/portal/stat-tile.tsx`) | `cream` (`#F4EEE2`) surface, `border-2` (`#EAE0CE`), radius `12px`, pad `14px 16px`. Label `muted-2` `12px`; value `16–19px`/600 `ink`. The four: Age, Mobility, Diet, GP. |
| About panel | `page.tsx` inline | `cream` tile, `border-2`, radius `12px`, pad `18px`. Eyebrow "ABOUT {pref}" (`navy` `13px`/700 uppercase). `note` paragraph (`ink-soft` `14.5px`, line-height `1.6`). |
| Care flags panel | `page.tsx` inline + `CareFlag` | `cream` tile, pad `18px`. Eyebrow "CARE FLAGS". Flex-wrap of `CareFlag` pills (margin-top `12px`). |
| Care flag pill (×N) | `CareFlag` (new, `components/portal/care-flag.tsx`) | Pill `13px`/600, radius `100px`, colored per flag from a semantic scale. Source shows Falls watch (rust `#93502F`/`#F1E0D3`), Diabetic (sage `#3F5137`/`#E5EBDD`), Hearing aid (amber `#6b5a2c`/`#EDE6D3`). |

## Data consumed
From `lib/mock-data/residents.ts` via **`getResidentBySlug(slug)`** → `Resident` (mirrors `residentsRaw`, lines 1105–1113; `[id]` param = `slug`, e.g. `margaret-whitcombe`). Fields used:
- `slug` — route param / lookup key.
- `name` — profile heading.
- `pref` — "Prefers "{pref}"" + "About {pref}" eyebrow.
- `wing`, `room` — subtitle + care tier.
- `colorKey` — gradient banner start + avatar bg.
- `avatar` — initials.
- `age`, `mobility`, `diet`, `gp` — the 4 stat tiles.
- `note` — About panel paragraph.
- `flags?` — `string[]` (e.g. Falls watch, Diabetic, Hearing aid) → `CareFlag` pills.

Derived (helpers, not stored):
- `careTier(wing)` → `Normal | Premium | VIP` (`wingTier`, line 1115).
- `careTierMeta(tier)` → `{ colorToken, tintToken }` (care-tier scale) for the header badge.
- Care-flag color mapping (Falls watch → rust, Diabetic → sage, Hearing aid → amber) via a small flag-meta helper.
- `initials(name)`.

## Variants & states
- **No role variance** — identical for admin and staff (access both).
- **Care-tier badge:** source hardcodes sage on the detail header (line 704); per 03-data-model this is derived from care tier via `careTierMeta` so it stays consistent with the list card (Normal sage / Premium navy / VIP gold). Use the derived value.
- **Gradient banner** color = resident `colorKey` → `navy`, so each profile has a distinct banner.
- **Care flags:** source shows a fixed trio (Falls watch, Diabetic, Hearing aid); the component renders whatever `flags` the resident carries, each colored from the flag-meta scale. If a resident has no flags, the panel renders empty (no pills) — keep the "Care flags" heading.
- **Static profile** — no editing/loading states.
- Responsive: 4-tile grid → 2 columns, 2-col About/Flags → stacked on narrow widths; avatar overlap preserved; no horizontal body scroll.

## Interactions
- **`‹ All residents`** back link → `/portal/residents`.
- No other interactions — profile is read-only; nothing to toggle or submit.

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) profile card; `cream` (`#F4EEE2`) stat/About/Flags tiles; `border` (`#E7DECD`) card, `border-2` (`#EAE0CE`) tile outlines.
- Banner gradient: `colorKey` (avatar palette) → `navy` (`#2C3563`).
- **Care-tier semantic scale** for the header badge; care-flag pills use severity-adjacent tints (rust `#93502F`/`#F1E0D3`, sage `#3F5137`/`#E5EBDD`, amber `#6b5a2c`/`#EDE6D3`) — referenced by name, never hardcoded per screen.
- Text: `ink` name/values, `#7a7163` subtitle, `muted-2` stat labels, `navy` panel eyebrows, `ink-soft` note.
- Type: Newsreader name `29px`/600, avatar initials `34px`, Age value `19px`; Instrument Sans labels/values/pills. Radius card `18px`, tiles `12px`, avatar `20px`, pills `100px`. `max-width:1180px`.

## Out of scope (this phase)
- No profile editing — read-only view (no field is writable).
- Care flags are display-only — no add/remove.
- `[id]`/`slug` not validated against a real store (mock lookup only); no 404 handling this phase.
- No links to the resident's room, incidents, or family posts from this screen.

## Definition of Done
Beyond global DoD (00-rules §11):
1. Profile header shows gradient banner (`colorKey` → navy), overlapping avatar, name, "Prefers "{pref}" · {wing} · Room {room}", and a care-tier badge from the care-tier scale (derived, no raw hex).
2. 4 stat tiles render Age / Mobility / Diet / GP from the resident record.
3. About panel shows "About {pref}" eyebrow + `note`; Care flags panel renders one `CareFlag` pill per `flags` entry with the correct flag-meta color.
4. `‹ All residents` → `/portal/residents`.
5. All content via `getResidentBySlug(slug)` + care-tier/flag helpers — no inline fixtures or raw hex.
