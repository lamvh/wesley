# Contact

- **Route:** `/contact` — `app/(marketing)/contact/page.tsx`
- **Section:** Marketing · **Access:** both
- **Source:** lines `380–411` (contact details `392–395`)
- **Render:** RSC (+ client island: `RequestVisitForm`)

## Purpose
Public contact / enquiry page. Gives phone, address, email and visiting hours, and offers a "request a visit" form. Destination of every marketing CTA ("Book a visit", "Apply now", "get in touch").

## Layout
Inside `MarketingLayout` (announcement + sticky nav + footer assumed). Body, top to bottom:
1. Header band (eyebrow + title + lede).
2. Two-column section (`1fr 1.1fr`, gap `52px`):
   - Left column: contact details stack + map placeholder.
   - Right column: "Request a visit" form card.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header band | `MarketingPageHeader` (shared, reused) | `eyebrow="Contact"`, title "Come and see for yourself", lede. `cream-2` band, bottom `border`. Lines `382–388`. |
| Contact details | `ContactDetails` (new) | Left column, vertical stack gap `24px`. Four blocks — Call us / Visit / Email / Visiting hours — each: uppercase muted-2 label + Newsreader navy value. Lines `390–396`. |
| Map placeholder | `Photo` (shared) | Below details: `<Photo slot="contact-map">`, `200px`, radius `16px`. Lines `397`. |
| Request-a-visit form | `RequestVisitForm` (new, client island) | Right column card: `cream-2` bg, `border`, radius `20px`, pad `34px`. H2 "Request a visit" + fields stack gap `12px`. Lines `399–408`. |

Reused: `MarketingPageHeader`, `Photo`. New: `ContactDetails`, `RequestVisitForm` (only client boundary on the page).

## Data consumed
Accessor `getMarketingContent()` (`lib/mock-data/marketing-content.ts`) → `contact`:
- `phone` = `09 630 1998`
- `address` = `227 Mt Eden Rd`, `suburb` = `Mt Eden, Tāmaki Makaurau`
- `email` = `hello@wesleymteden.nz`
- `visitingHours` = `Every day, 9:00am – 7:00pm.` + `Whānau are always welcome.`

(Source `392–395`; also referenced in 03-data-model marketing-content.) Form option list is static UI: "Room of interest…" placeholder + VIP suite / Premium suite / Normal room / Not sure yet (line `404`). Photo slot: `contact-map`.

## Variants & states
- No role/auth differences — public page.
- Form fields are controlled inputs (client island): name (text), phone/email (text), room-of-interest (`select`), message (`textarea` 4 rows). Local state only.
- Focus states on all fields (visible focus ring, `field` border). No validation, no error/success states this phase.
- Photo slot with no mapped file → `Photo` labelled placeholder ("Map or street view").

## Interactions
- Typing updates local field state (controlled inputs).
- "Request a visit" submit button — **inert this phase** (no network, `console`-noop; no email/DB write).
- Contact values are plain text (no `tel:`/`mailto:` requirement this phase; may be added without doc change).

## Tokens
`cream-2` (header + form card) · `cream` (`F4EEE2`, input backgrounds) · `field` (input borders) · `border` (form card + rules) · `bronze-text` (eyebrow) · `muted-2` (detail labels) · `navy` (detail values + submit button bg) · `ink-soft` (visiting-hours body) · `cream` (submit label). Newsreader: H1 `46px`, detail values `22–26px`, form H2 `24px`. Radius: form card / map `20px`/`16px`, inputs + button `11px`. Section two-col `1fr 1.1fr` gap `52px`, pad `60px/28px`, `max-width:1200px`.

## Out of scope (this phase)
- Form submit is inert — no send, no persistence, no email. Present visually per design, wired to a `console`-noop.
- No field validation, no success/thank-you state.
- `contact-map` is a `Photo` placeholder — no embedded/interactive map.
- Phone/email are text, not actionable `tel:`/`mailto:` links (this phase).

## Definition of Done
Beyond global DoD (00-rules §11):
- `/contact` renders header, contact-details stack (phone `09 630 1998`, address `227 Mt Eden Rd`, email `hello@wesleymteden.nz`, visiting hours), map placeholder, and request-a-visit form in the two-column layout of lines `380–411`.
- Contact values come from `getMarketingContent().contact`; none inlined in JSX.
- `RequestVisitForm` is the smallest client island; page + `ContactDetails` stay RSC.
- Submit noted inert; no mutation fires.
- Columns stack on narrow widths (details above form); no horizontal body scroll.
