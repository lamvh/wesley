# Our rooms

- **Route:** `/our-rooms` - `app/(marketing)/our-rooms/page.tsx`
- **Section:** Marketing · **Access:** both
- **Source:** lines `204–232` (screen) + `1413–1417` (`careLevels` data)
- **Render:** RSC (no client islands - static content, links only)

## Purpose
Marketing page presenting the three room styles (VIP, Premium, Normal) so prospective residents/families can compare and enquire. Public visitors browsing options before contacting the home.

## Layout
Two stacked full-width bands inside `MarketingLayout`:
1. **Header band** - cream surface (`cream-2`) with bottom border; eyebrow "Our rooms", H1, intro paragraph. `max-width:1200px`, pad `60px 28px`.
2. **Room rows** - vertical stack (`flex-col`, gap `26px`) of three large room cards, one per `careLevels` entry. Each card is a 2-column grid: photo left (`.9fr`), text panel right (`1.1fr`), rounded `20px`, `cream-2` surface, `border` outline, `overflow:hidden`.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header band | `MarketingPageHeader` (new, shared across marketing pages) | Props: `eyebrow`, `title`, `intro`. Eyebrow uppercase `bronze-text`; H1 Newsreader `46px` weight 500; intro `muted`, `max-width:580px`. Reused by Life here + other marketing headers. |
| Room rows wrapper | `page.tsx` section | `flex-col` gap `26px`, `max-width:1200px`, pad `60px 28px`. Maps `getRoomStyles()` → `RoomStyleRow`. |
| Room row (×3) | `RoomStyleRow` (new, `components/marketing/room-style-row.tsx`) | 2-col grid `.9fr 1.1fr`. Left: `<Photo slot={c.slot} alt={c.name}/>`, `min-height:300px`. Right panel pad `34px 40px`: wing label, name, desc, points, enquire button. Distinct from portal `room-card` (occupancy tile) - this is a marketing feature row. |
| Photo | `Photo` (shared `components/shared/photo.tsx`) | Maps `slot` (`vme-care1/2/3`) → file; labelled placeholder fallback = `c.name`. `shape=rect`, fills left cell. |
| Wing label | inline in `RoomStyleRow` | `11.5px` weight 700, uppercase, letter-spacing `1.4px`, `bronze` color. |
| Points list | inline in `RoomStyleRow` | `flex-col` gap `10px`; each point = checkmark span (`navy`, weight 700) + text (`ink-soft`, `14.5px`). 3 points per row. |
| Enquire button | `Button` (shadcn, `variant=primary`) wrapped in `next/link` to `/contact` | Navy fill, cream text, radius `11px`, pad `12px 20px`, `14.5px` weight 600. Label `Enquire about {name}`. |

## Data consumed
From `lib/mock-data/marketing-content.ts` via `getRoomStyles()` → `careLevels: RoomStyle[]` (mirrors source `careLevels`, lines 1413–1417). Fields per entry:
- `name` - e.g. "VIP suite", "Premium suite", "Normal room" (also used in button label).
- `wing` - e.g. "VIP · Tōtara wing" (wing label).
- `slot` - photo slot id (`vme-care1` / `vme-care2` / `vme-care3`).
- `desc` - paragraph copy.
- `points` - `string[]` of exactly 3 checkmark points.

Order preserved: VIP → Premium → Normal (source order).

## Variants & states
- **No role variance** - public marketing, identical for all visitors.
- **Static list** - always exactly 3 rows; no empty/loading state (mock data fixed).
- **Photo fallback** - if a slot has no mapped file, `Photo` renders labelled placeholder using `name` string (per source `placeholder="{{ c.name }}"`).
- **Hover** - enquire button uses shadcn primary hover (slight darken); card itself has no hover elevation in source.
- Responsive: below md the 2-col grid stacks (photo above text panel); no horizontal body scroll.

## Interactions
- **Enquire about {name}** button → navigates to `/contact` (source `onClick=navContact`, line 226; here a real `next/link`). One per row, all target `/contact`.
- No other clicks; photos are non-interactive.
- Header + nav come from `MarketingLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) card/band, `border` (`#E7DECD`) outlines.
- Text: `bronze-text` eyebrow, `bronze` wing label, `ink`/`ink-soft` headings/points, `muted` intro & desc.
- Accent: `navy` (`#2C3563`) checkmarks + primary button, `cream` (`#F4EEE2`) button text.
- Type: Newsreader H1 `46px`/500, H2 room name `30px`/600; Instrument Sans body/points/button.
- Radius: card `20px`, button `11px`. Section pad `60px 28px`, `max-width:1200px`.
- No care-tier semantic scale here - marketing rows use brand tokens only (tier colors belong to the portal room/resident screens).

## Out of scope (this phase)
- **Enquire buttons** navigate to `/contact` but the contact form there is inert (no real submission) - noted on the contact screen.
- No per-room detail page, gallery lightbox, availability, or pricing.
- Photos may render as placeholders until slot→file mapping is populated in `lib/mock-data/photos.ts`.

## Definition of Done
Beyond global DoD (00-rules §11):
1. Exactly 3 `RoomStyleRow`s render in source order (VIP, Premium, Normal), each with photo cell, wing label, name, desc, 3 checkmark points, enquire button.
2. All content from `getRoomStyles()` - no inline copy in JSX.
3. Every "Enquire about X" button links to `/contact`.
4. `MarketingPageHeader` renders eyebrow/title/intro matching source lines 208–210.
5. Layout matches source 213–229 (2-col grid, gaps, radii) via tokens; no raw hex.
