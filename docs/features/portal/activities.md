# Activities

- **Route:** `/portal/activities` — `app/portal/activities/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `941–1029` (markup); data `1335–1352`
- **Render:** RSC (+ client islands: none — `+ Add activity` / `View gallery` inert)

## Purpose
The home's activities hub: a featured celebration story with photos, upcoming resident birthdays, a gallery of recent highlights, and the full seven-day programme colour-coded by category. Used by activities/care staff and admin to see and share what's on.

## Layout
Centered column (`max-width:1180px`). Top-to-bottom:
1. Header row — title + programme-week subline left, `+ Add activity` button right.
2. Two-column feature row (`grid-template-columns:1.55fr 1fr`, gap `16px`): featured celebration card + upcoming-birthdays card.
3. "Recent highlights" section: heading + `View gallery` link, then a 4-card image gallery (`repeat(4,1fr)`).
4. "This week's programme" section: heading + category colour legend, then a 7-column day grid (`repeat(7,minmax(0,1fr))`).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header (title, week, add) | `activities-header` | Title `Activities` (Newsreader 32px); subline `This week's programme · 7–13 July`; `+ Add activity` = accent primary button |
| Featured celebration card | `celebration-card` | Photo mosaic (238px): 1 large + 2 stacked, via **direct `assets/` images** (`act-podiatry-1.jpeg`, `birthday-candles.jpeg`, `birthday-portrait.jpeg`) — not `<Photo slot>`. Body: `Celebration` gold pill + `Yesterday · Kōwhai lounge` meta, Newsreader headline, paragraph. Static content (not from a list accessor). |
| Upcoming birthdays card | `birthday-list` + `birthday-row` | Cake-icon tile + title. Each row: 36px avatar (initials on `b.color`), `name`, `room` meta, right-aligned gold `badge` (e.g. `90th`) + `date`. |
| Recent highlights gallery | `highlight-card` (×4) | Card = cream-2 + border, radius `14px`. 150px `assets/act-*.jpeg` / `birthday-*.jpeg` image, then category eyebrow (`Wellbeing · Tue`, colour by category) + title. Direct asset images, static. |
| Weekly programme grid | `activity-week` → `activity-day` → `activity-chip` | 7 day columns (`min-height:280px`). Day header shows `dow` + `date`; today's header tinted (`d.today`). Each `activity-chip`: category tint bg (`a.tint`), `time` (in `a.color`), `title`, `where`. |
| Category legend | `category-legend` | Dot + label per category (Garden, Music, Movement, Social, Wellbeing, Faith) using activity-category scale. |

Grids: feature row `1.55fr 1fr`; highlights `repeat(4,1fr)`; week `repeat(7,minmax(0,1fr))`.

## Data consumed
From `lib/mock-data/activities.ts` (see 03-data-model.md):
- `getActivityWeek()` → `ActivityDay[]`: `dow`, `date`, `isToday` (drives today header tint), `items[]`. Each `Activity`: `time`, `title`, `where`, `category` (`garden`|`music`|`move`|`social`|`craft`|`care`|`faith`). Chip `tint` + `color` derived from `category` via the activity-category scale helper (`catTint` map), not stored raw.
- `birthdays` (`getBirthdays()`) → `Birthday[]`: `name`, `room`, `date`, `initials`, `colorKey`, `badge`.
- **Featured celebration + recent highlights are static** (headline, meta, paragraph, and the highlight cards' captions/categories are literal in the design, not list-driven) — colocate as small typed constants in `activities.ts` rather than inline in JSX.

**Image strategy note:** this screen uses **direct `assets/` files** copied to `public/images/` (`act-podiatry-1/2/3`, `act-birthday-cakes`, `act-birthday-group`, `birthday-candles`, `birthday-portrait`) rendered via `next/image` — distinct from the marketing/family `<Photo slot="…">` slot-mapping pattern. No `image-slot` placeholders here.

## Variants & states
- **Role:** identical for admin and staff (access `both`); no role-gated content.
- **Today highlight:** the day whose `isToday` is true gets a tinted header (`#E7E9F5`); others transparent. Friday 11 is "today" in mock data.
- **Category-driven styling:** every chip's background/text colour comes from its `category` — seven fixed tints; legend pairs each colour with a text label (colour never sole signal).
- **Empty state:** a day with no `items` renders an empty column body; a card with zero birthdays would show only the header — not exercised (all populated).
- Chip count per day varies (2–5); columns are equal width, height grows with content over the `280px` min.

## Interactions
- `+ Add activity` — inert stub (would open an add-activity flow). No-op.
- `View gallery` link — inert stub (would open a photo gallery). No-op.
- Highlight cards / chips / birthday rows are non-interactive (no detail route this phase).

## Tokens
- **Activity-category semantic scale** (01-design-system.md): garden `#3F5137`/`#E5EBDD` · music `#8a4b6b`/`#F2DEE8` · move `#6b5a2c`/`#EDE6D3` · social `#93502F`/`#F1E0D3` · craft `#3d6b74`/`#E1EAEC` · care/wellbeing `#2C3563`/`#E4E6F2` · faith `#8A6516`/`#F3E8CE`. Used for chip tint+text, legend dots, and highlight eyebrows.
- Gold `#8A6516`/`#F3E8CE` for the `Celebration` pill and birthday `badge`; bronze-text `#B07C22` for the `View gallery` link.
- Avatar palette for birthday `colorKey`; today-header tint `#E7E9F5` (navy-muted wash).
- Surfaces cream-2 + `border`; radius cards `16px`, highlight/day cards `14px`, chips `10px`. Fonts: Newsreader (title, headings, headline, `date` numbers), Instrument Sans (body, chip text, eyebrows).

## Out of scope (this phase)
Present visually but inert: `+ Add activity`, `View gallery`. No activity creation/editing, no real gallery, no birthday reminders, no "today" computation (Friday 11 is hardcoded).

## Definition of Done
- Featured celebration card renders the 3-image mosaic from direct `assets/` files (via `next/image`), with correct pill/meta/headline/paragraph.
- Upcoming birthdays list renders all rows with badges/dates from `birthdays`.
- Recent highlights shows the 4 direct-asset gallery cards with category eyebrows.
- Weekly programme renders 7 day columns with category-tinted chips from `getActivityWeek()`; today's column header is tinted; legend matches the activity-category scale.
- No raw hex in JSX; chip/eyebrow colours via the category-scale helper. Global DoD (00-rules §11) met.
