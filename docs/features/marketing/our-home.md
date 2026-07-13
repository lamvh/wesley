# Our home

- **Route:** `/our-home` — `app/(marketing)/our-home/page.tsx`
- **Section:** Marketing · **Access:** both
- **Source:** lines `280–336` (data `1432–1444`)
- **Render:** RSC (no client islands)

## Purpose
Public "about the building" page. Sells the physical home — its scale, feel, facilities and three wings — to prospective residents and their whānau, then routes them to book a visit.

## Layout
Inside `MarketingLayout` (announcement + sticky nav + footer assumed). Body, top to bottom:
1. Header band (eyebrow + title + lede).
2. Intro split — photo left, copy right.
3. Facilities section (tinted band, 6-card grid).
4. Three-wings section (3 image cards).
5. Find-us navy panel (address + CTA + map).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header band | `MarketingPageHeader` (new, shared by all 3 marketing pages) | Props: `eyebrow`, `title`, `lede`. `cream-2` band, bottom `border`. Section pad `60px/28px`, `max-width:1200px`. Lede `max-width:580px`. Lines `282–288`. |
| Intro split | `PhotoCopySplit` (new) | 2-col grid `1fr 1fr`, gap `52px`, `align:center`. Left: `<Photo slot="home-exterior">` in `340px`, radius `20px`. Right: H2 + paragraph. Lines `289–295`. |
| Facilities | `FacilityGrid` → `FacilityCard` (new) | Tinted `cream-2` band w/ top+bottom `border`. H2 + grid `repeat(3,1fr)` gap `18px` (6 cards). Card: `cream` bg, `border`, radius `16px`, pad `22px`, `f.title` (Newsreader 18) + `f.desc`. Lines `296–308`. |
| Three wings | `WingCardGrid` → `WingCard` (new) | H2 + grid `repeat(3,1fr)` gap `18px` (3 cards). Card: `cream-2` bg, `border`, radius `16px`, overflow hidden. Top: `<Photo slot="wing-{name}">` `150px`. Body pad `20px/22px`: care label (bronze, uppercase) + `w.name` (Newsreader 23) + `w.desc`. Lines `309–323`. |
| Find us panel | `FindUsPanel` (new) | Navy card radius `20px`, 2-col `1fr 1fr`. Left pad `44px`: gold eyebrow "Find us", H2 "227 Mt Eden Rd", copy, "Book a visit" button → `/contact`. Right: `<Photo slot="home-map">` min-h `280px`. Lines `324–334`. |

Reused: `Photo` (`components/shared`). New shared: `MarketingPageHeader` (also used by careers + contact).

## Data consumed
Accessor `getMarketingContent()` (`lib/mock-data/marketing-content.ts`):
- `facilities` — 6× `{ title, desc }` (source `1432–1439`).
- `careWings` — 3× `{ name, care, desc }` where `name` = Rātā | Kōwhai | Tōtara, `care` = Normal | Premium | VIP (source `1440–1444`).

Header/intro/find-us copy is static screen content (not entity data): title "A boutique home in the heart of Mt Eden", intro H2 "Built around people, not corridors", find-us address "227 Mt Eden Rd". Photo slots: `home-exterior`, `wing-Rātā` / `wing-Kōwhai` / `wing-Tōtara`, `home-map`.

## Variants & states
- No role/auth differences — public page, identical for all visitors.
- No empty states — `facilities` (6) and `careWings` (3) always present.
- Photo slots with no mapped file → `Photo` labelled placeholder ("Exterior or lounge", "{name} wing", "Map or street view").
- Hover: facility/wing cards static; "Book a visit" button gets pointer + subtle hover per button token.

## Interactions
- "Book a visit" button → `next/link` `/contact` (design `navContact`, line `330`).
- No other clicks; cards non-interactive.

## Tokens
`cream-2` (header/wing/find-us surfaces) · `cream` (facility card) · `border` (card + section rules) · `bronze-text` (eyebrow) · `bronze` (wing care label) · `navy` (find-us panel) · `gold` (find-us eyebrow) · `ink` / `muted` (headings/body) · cream-on-navy text in panel. Newsreader: H1 `46px`, H2 `30px`, wing title `23px`, facility title `18px`. Radius: cards `16px`, panels/photos `20px`, button `11px`. Section rhythm `60px` vertical / `28px` horizontal, `max-width:1200px`.

## Out of scope (this phase)
- Photo slots `home-exterior`, `home-map`, `wing-*` render labelled placeholders until real files mapped in `photos.ts`.
- Find-us map is a `Photo` placeholder only — no embedded/interactive map.

## Definition of Done
Beyond global DoD (00-rules §11):
- `/our-home` renders header, intro split, 6 facility cards, 3 wing cards, navy find-us panel in order matching lines `280–336`.
- All 6 facilities + 3 wings come from `getMarketingContent()`; none inlined.
- "Book a visit" navigates to `/contact`.
- `MarketingPageHeader` extracted as shared component (consumed here + careers + contact).
- Grids collapse to single column on narrow widths without horizontal body scroll.
