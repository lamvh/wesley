# Home

- **Route:** `/` — `app/(marketing)/page.tsx`
- **Section:** Marketing · **Access:** both (public)
- **Source:** lines `59–201` (body), marketing data `1412–1425` (careLevels, features), hero stats `81–83`, testimonial `176–180`, contact `189–190`
- **Render:** RSC (+ client islands: `enquiry-form` inputs only; page chrome via MarketingLayout)

## Purpose

Public landing page for Wesley Home & Care. Introduces the boutique rest-home to prospective residents' families, previews the three room styles, life on site, the new family portal, and drives a visit enquiry. Primary audience: whānau researching aged care.

## Layout

Body inside `MarketingLayout` (announcement + nav + footer assumed). Top-to-bottom:

1. **Hero** — full-bleed photo, `640px` tall, overlay + left-aligned content, stats strip pinned to bottom.
2. **Welcome** — 2-col: copy + chips (left) / photo collage (right).
3. **Care levels** — cream band, section header + 3-up room-style cards.
4. **Life here** — centered header + 6-up (3×2) feature grid.
5. **Family portal teaser** — navy full-width band, 2-col: copy + checklist / sample update card.
6. **Testimonial** — centered pull-quote.
7. **Enquiry CTA** — rounded panel, 2-col: contact info / inert form.

## Sections & components

Ordered. Component = new (this page) or reused (shared marketing).

| Section | Component | Notes |
|---------|-----------|-------|
| Hero | `hero` (new) | `section` `height:640px`, `<Photo slot="vme-hero">` bg via `next/image`, left→right dark gradient overlay. Content `max-width:600px`: badge pill "Boutique aged care · Est. 1998" (translucent cream), H1 Newsreader `62px` "A warm place to call home, in the heart of Mt Eden", subcopy `18.5px`, 2 CTAs. Source 60–86. |
| — hero CTAs | inside `hero` | "Book a visit" (solid cream, `ink` text) → `/contact`; "Explore our rooms" (translucent outline) → `/our-rooms`. Source 72–75. |
| — hero stats | `stat-strip` (new) or inline | 3 stats pinned bottom, `gap:38px`: **54** care suites · **1:5** day carer ratio · **27 yrs** caring for Tāmaki. Newsreader `30px` value + `12.5px` label. Source 81–83. |
| Welcome | `welcome-section` (new) | Grid `1.05fr .95fr`, `gap:64px`, `padding:88px 28px`. Left: eyebrow "Haere mai · Welcome" (`bronze-text`), H2 `42px`, paragraph, 3 chips. Right: 3-tile photo collage. Source 88–105. |
| — welcome chips | inline spans | 3 pills: "Registered nurses on site 24/7" (sage), "Chef-prepared meals" (terracotta tint), "Whānau always welcome" (amber tint). Semantic tint colors, radius `100px`. Source 94–98. |
| — welcome collage | `<Photo>` ×3 | Grid `1fr 1fr` / rows `180px 180px`: `vme-w1` (spans 2 rows, "Resident & carer"), `vme-w2` ("Garden"), `vme-w3` ("Dining"), radius `18px`. Source 100–104. |
| Care levels | `care-level-grid` + `room-card` (new; `room-card` reused by Our rooms) | Band `cream-2`, top/bottom `border`. Header: eyebrow "Our rooms", H2 `40px` "Three room styles, one caring team", intro paragraph. Grid `repeat(3,1fr)`, `gap:20px`. Iterates `careLevels` (3). Source 107–131. |
| — room-style card | `room-card` | `<Photo slot={c.slot}>` (`vme-care1..3`) header `150px`; body: wing eyebrow (`bronze`, e.g. "VIP · Tōtara wing"), H3 Newsreader `23px` name, desc, "Learn more ›" (`bronze-text`, → `/our-rooms`). Source 118–128. |
| Life here | `feature-grid` + `feature-card` (new; reused by Life here page) | Centered header: eyebrow "Life at Wesley", H2 `40px` "Days full of small, good things". Grid `repeat(3,1fr)`, `gap:18px` (6 items → 3×2). Iterates `features` (6). Source 133–148. |
| — feature card | `feature-card` | 46×46 icon tile (`#E4E6F2`/`navy`, radius `12px`) with inline SVG, H3 Newsreader `21px` title, desc. `cream-2` bg, `border`, radius `16px`, `padding:26px`. Source 141–146. |
| Family portal teaser | `family-portal-teaser` (new) | Navy (`navy`) full-width band, grid `1fr 1fr`, `gap:56px`, `padding:82px 28px`. Left: "New" gold badge pill, H2 `40px` `cream` "Stay close, wherever you are", paragraph, 3-item ✓ checklist, "Preview the family portal" button (cream) → `/portal/family`. Right: sample update card. Source 150–173. |
| — sample card | inside teaser | `cream` card radius `20px`, float shadow. Header: "PW" bronze avatar tile + "Peggy Whitcombe · Rātā 12" / "Today's update from Aroha". `<Photo slot="vme-fam">` `150px`. Quote text about sweet peas. Source 164–171. |
| Testimonial | `testimonial-quote` (new) | Centered, `max-width:900px`, `padding:86px 28px`. Big Newsreader open-quote glyph, italic `29px` quote, attribution "Katherine R. — daughter of a Kōwhai resident". Source 175–180. |
| Enquiry CTA | `enquiry-cta` + `enquiry-form` (new; form is client island) | `cream-2` panel radius `24px`, `padding:52px`, grid `1.2fr 1fr`, `gap:48px`. Left: H2 `36px` "Come and see for yourself", paragraph, contact block (Call us / Visit). Right: `enquiry-form`. Source 182–200. |
| — contact block | inline | "Call us" → **09 630 1998**; "Visit" → **227 Mt Eden Rd** (Newsreader `22px`, `navy`). Source 189–190. |
| — enquiry form | `enquiry-form` (**client**) | Inputs: name, "Phone or email", "How can we help?" textarea (rows 3), "Request a visit" submit (solid `navy`). `field`-bordered `cream` inputs, radius `11px`. Submit inert. Source 193–198. |

## Data consumed

From `lib/mock-data/marketing-content.ts` via `getMarketingContent()` (or split accessors), per 03-data-model.md:

- **`careLevels`** (3) — fields: `name`, `wing`, `slot`, `desc`, `points[]` (points shown on Our rooms detail; card here uses name/wing/slot/desc). Source 1413–1417.
- **`features`** (6) — fields: `title`, `desc`, `icon` (SVG path, rendered via `Icon`). Source 1418–1425.
- **`stats`** — hero strip trio (`54` care suites / `1:5` day carer ratio / `27 yrs`). Source 81–83 (per data-model `stats` accessor).
- **`testimonial`** — `quote` + `attribution`. Source 178–179.
- **`contact`** — `phone` (09 630 1998), `address` (227 Mt Eden Rd), `email` (hello@wesleymteden.nz, used site-wide). Source 189–190 + data-model §Marketing content.
- **Photos** via `<Photo slot=...>` (`photos.ts` slot map): `vme-hero`, `vme-w1/2/3`, `vme-care1/2/3`, `vme-fam`. Unmapped → labelled placeholder.

No portal/domain entities on this page.

## Variants & states

- **No role variant** — public page, identical for all visitors.
- **Photo slots** — mapped slot → `next/image`; unmapped → labelled placeholder (design placeholder string, e.g. "Drop a hero photo").
- **Care-level cards** — driven by `careLevels`; if list empty, grid renders nothing (not expected — always 3).
- **Feature grid** — 6 items → 3×2 desktop; degrade to 2-up / 1-up on narrow widths.
- **Hover** — CTAs/cards show pointer + subtle lift (card hover shadow token); "Learn more ›" / "Preview the family portal" are pointer links.
- No loading/empty/error states (static mock data).

## Interactions

- **Hero** "Book a visit" → `/contact`; "Explore our rooms" → `/our-rooms`.
- **Care-level** "Learn more ›" → `/our-rooms`.
- **Family portal teaser** "Preview the family portal" → `/portal/family`.
- **Enquiry form** — controlled inputs (client); "Request a visit" submit is **inert** (no POST) this phase.
- Announcement / nav / footer interactions handled by MarketingLayout (see components/marketing-layout.md).

## Tokens

- Colors: `navy` (CTAs, icon tiles, portal band, form submit, contact figures), `gold` (NEW badge, sample-card avatar via bronze), `cream`/`cream-2` (surfaces, on-navy text), `bronze-text` (eyebrows, "Learn more"), `bronze` (card wing label), `ink`/`ink-soft` (headings, quote), `muted`/`muted-2` (body, meta), `border` (card borders), `field` (input borders).
- Semantic tints (welcome chips): care/sage `#E5EBDD`/`#3F5137`, social `#F1E0D3`/`#93502F`, move `#EDE6D3`/`#6b5a2c` — reference by named scale, never hardcode.
- Type: Newsreader — hero H1 `62px`, section H2 `40–42px`, card titles `21–23px`, stat numbers `30px`, testimonial `29px`; Instrument Sans — body `15–18.5px`, eyebrow `12–13px` uppercase `letter-spacing:2px`.
- Radius: cards `16–18px`, large panels `20–24px`, buttons/inputs `11–12px`, pills `100px`. Shadow: sample card / hero float `0 30px 60px -30px rgba(0,0,0,.5)`.
- Hero gradient overlay: left→right dark scrim (port inline gradient to a token/utility, not raw hex in JSX).

## Out of scope (this phase)

- **Enquiry form submit** ("Request a visit") — inert, no backend/email send.
- **Announcement link** & nav/footer targets — see MarketingLayout doc; some footer labels inert.
- No real photo lightbox / gallery; photos are static `next/image`.
- No analytics, no phone `tel:` / email `mailto:` wiring required (may render as plain text this phase).
- "Learn more ›" links route to `/our-rooms` list (no deep-link to a specific room style — no such detail route in scope).

## Definition of Done

Beyond global DoD (00-rules §11):

1. All 7 sections render in source order at `/`, pixel-faithful to lines 59–200.
2. `careLevels` (3) and `features` (6) come from `getMarketingContent()` accessors — no inline fixtures; card/feature counts match source.
3. Hero, care-level, welcome, sample-card photos use `<Photo slot>` with correct slot IDs; unmapped slots show labelled placeholder.
4. Hero + care + teaser CTAs navigate to `/contact`, `/our-rooms`, `/portal/family` respectively.
5. `enquiry-form` is the only client island; rest of page is RSC; submit is inert with no error.
6. Stats, testimonial, contact figures match source values (54 / 1:5 / 27 yrs; Katherine R.; 09 630 1998 / 227 Mt Eden Rd).
7. Semantic chip tints reference named scales; no raw hex or inline `style` in JSX; `pnpm build` + `pnpm lint` clean.
