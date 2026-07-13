# Life here

- **Route:** `/life-here` — `app/(marketing)/life-here/page.tsx`
- **Section:** Marketing · **Access:** both
- **Source:** lines `235–277` (screen) + `1418–1431` (`features`, `dayTimeline` data)
- **Render:** RSC (no client islands — static content, no interactivity)

## Purpose
Marketing page conveying daily life at the home: what residents do, eat and enjoy. Prospective residents/families getting a feel for the everyday experience.

## Layout
Header band + three content sections stacked in `MarketingLayout`, all `max-width:1200px`, `28px` horizontal pad:
1. **Header band** — `cream-2` surface, bottom border; eyebrow "Life here", H1, intro. Pad `60px 28px`.
2. **Feature grid** — 3-column grid (`repeat(3,1fr)`, gap `18px`) of 6 feature cards. Pad `60px 28px 20px`.
3. **A day at Wesley** — H2 + 4-column timeline (`repeat(4,1fr)`, gap `18px`) of `dayTimeline` steps. Pad `30px 28px 40px`.
4. **Photo gallery mosaic** — 3-col × 2-row CSS grid (`2fr 1fr 1fr` / `200px 200px`, gap `14px`); first tile spans both rows, 4 more tiles fill remainder. Pad `20px 28px 64px`.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header band | `MarketingPageHeader` (shared, reused from Our rooms) | Props `eyebrow="Life here"`, `title`, `intro`. Same styling as Our rooms header. |
| Feature grid | `FeatureGrid` (new, `components/marketing/feature-grid.tsx`) | 3-col grid gap `18px`; maps `getFeatures()` → `FeatureCard`. |
| Feature card (×6) | `FeatureCard` (new, in `feature-grid.tsx` or sibling) | `cream-2` card, `border`, radius `16px`, pad `26px`. Icon tile `46×46`, radius `12px`, bg `#E4E6F2` (navy tint), `navy` stroke icon via `innerHTML`/`Icon`. H3 Newsreader `21px`/600, desc `muted` `14.5px`. |
| Icon | `Icon` (shared `components/shared/icons.tsx`) | Inline SVG 19×19, `stroke-width:1.8`, `currentColor`. Feature icons per source (cutlery, clock, plant, chat, heart, scissors — lines 1419–1424). |
| Section heading | inline `<h2>` in `page.tsx` | "A day at Wesley", Newsreader `30px`/500, margin-bottom `26px`. |
| Day timeline | `DayTimeline` (new, `components/marketing/day-timeline.tsx`) | 4-col grid gap `18px`; maps `getDayTimeline()` → `DayStep`. |
| Day step (×4) | `DayStep` (inline in `day-timeline.tsx`) | Top border `3px solid bronze` (`#B88A34`), pad-top `16px`. Time label `12px`/700 uppercase `bronze-text`; title Newsreader `20px`/600; desc `muted` `14px`. |
| Gallery mosaic | `PhotoMosaic` (new, `components/marketing/photo-mosaic.tsx`) | 3-col grid `2fr 1fr 1fr`, rows `200px 200px`, gap `14px`. Tile 1 (`life-g1`) `grid-row:span 2`; tiles `life-g2..g5` fill. Each tile radius `18px`, `overflow:hidden`. |
| Photo (×5) | `Photo` (shared) | Slots `life-g1`…`life-g5`; alt/placeholder = source labels ("Life at Wesley", "Activity", "Garden", "Dining", "Celebration", lines 269–273). |

## Data consumed
From `lib/mock-data/marketing-content.ts`:
- `getFeatures()` → `features: Feature[]` (6 items, lines 1418–1425). Fields: `title`, `desc`, `icon` (icon-set key/SVG). Order preserved: Chef-prepared meals, Activities & outings, Landscaped gardens, The family portal, Physio & wellbeing, Hair salon & podiatry.
- `getDayTimeline()` → `dayTimeline: DayStep[]` (4 items, lines 1426–1431). Fields: `time` ("Morning"/"Midday"/"Afternoon"/"Evening"), `title`, `desc`.
- Gallery photo slots (`life-g1`…`life-g5`) resolved by `Photo` via `lib/mock-data/photos.ts`; slot ids + fallback labels are static (no accessor needed beyond `Photo`).

## Variants & states
- **No role variance** — public marketing.
- **Static** — always 6 features, 4 timeline steps, 5 gallery tiles; no empty/loading states.
- **Photo fallback** — unmapped slot → labelled placeholder (source `placeholder` string).
- **Hover** — feature cards may adopt the shared card hover shadow (`0 8px 20px -12px rgba(0,0,0,.18)`); source shows none, keep subtle or omit.
- Responsive: below md, 3-col feature grid → 1 col, 4-col timeline → 2 col, mosaic → single column stack; no horizontal body scroll.

## Interactions
- **None** — no buttons, links, toggles, or filters on this screen. Purely presentational.
- Header + nav supplied by `MarketingLayout` (out of scope here). Cross-links to `/our-rooms`, `/contact` live in nav/footer, not this body.

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) header band + cards, `border` (`#E7DECD`) outlines.
- Text: `bronze-text` eyebrow + timeline time labels, `ink`/`ink-soft` headings, `muted` intros/desc.
- Feature icon tile: navy-tint bg `#E4E6F2` (from Care tier "Premium" tint / navy scale) + `navy` stroke.
- Timeline accent: `bronze` (`#B88A34`) top border.
- Type: Newsreader H1 `46px`/500, H2 `30px`/500, feature H3 `21px`/600, step title `20px`/600; Instrument Sans body/labels.
- Radius: feature card `16px`, gallery tile `18px`. Section `max-width:1200px`, `28px` horizontal pad.

## Out of scope (this phase)
- No interactive elements to stub — screen is inert by design.
- Gallery tiles are static images (no lightbox, carousel, or captions overlay).
- Photos may render as labelled placeholders until slot→file mapping is populated in `lib/mock-data/photos.ts`.

## Definition of Done
Beyond global DoD (00-rules §11):
1. Header (`MarketingPageHeader`) matches source lines 239–241 (eyebrow/title/intro).
2. `FeatureGrid` renders exactly 6 cards from `getFeatures()`, each with navy-tint icon tile, title, desc — 3 columns on desktop.
3. `DayTimeline` renders exactly 4 steps from `getDayTimeline()` in order Morning→Evening, each with bronze top border, time label, title, desc — 4 columns on desktop.
4. `PhotoMosaic` renders 5 tiles with tile 1 spanning 2 rows, matching source grid template (269–273).
5. All content via accessors; icons via shared `Icon`; no inline copy or raw hex; responsive stacking with no horizontal scroll.
