# MarketingLayout

- **Wraps:** the `(marketing)` route group — `app/(marketing)/layout.tsx`
- **Section:** Marketing · **Access:** both (public)
- **Source:** lines `28–58` (announcement + sticky nav), `413–427` (footer), nav state/handlers `1364–1385`
- **Render:** RSC shell (announcement, footer are static server components; nav is a client island for active state)

## Purpose

Shared chrome for all 6 marketing pages (Home, Our rooms, Life here, Our home, Careers, Contact). Gives the public site one persistent announcement bar, one sticky blurred top nav, one footer. Every marketing `page.tsx` renders only its body; this layout supplies the frame.

## Layout

Top-to-bottom, wrapping `{children}`:

1. **Announcement bar** — full-width navy strip, one enquiry line.
2. **Sticky nav** — logo (left) · nav items (center) · Family login + Staff portal buttons (right). `position:sticky; top:0; z-index:40`, translucent cream + backdrop blur.
3. **`{children}`** — the active marketing page body.
4. **Footer** — navy-deep, 4-column grid + bottom copyright row.

## Sections & components

Ordered. Layout composes three sub-components around `{children}`.

| Section | Component | Notes |
|---------|-----------|-------|
| Announcement bar | `announcement-bar` (new, RSC) | Navy `navy` bg, `cream`-ish text, centered, `13.5px`, `padding:9px 20px`. Copy: "Now taking enquiries for our new VIP & premium suites — book a visit this week ›". Inline link segment underlined; targets `/contact` (source uses `navContact`). Source 31–34. |
| Sticky nav | `site-nav` (new, **client island**) | `<header>` sticky, `bg cream/.86` + `backdrop-blur`, `border-b border`. Inner `max-width:1200px`, `padding:15px 28px`, flex space-between. Reads `usePathname()` for active item. Source 35–57. |
| — logo | inside `site-nav` | 40×40 `navy` tile radius `11px`, gold "W" in Newsreader `22px`; wordmark "Wesley" + eyebrow "HOME & CARE" (`11px`, `letter-spacing:2px`, uppercase, `muted-2`). Click → `/`. Source 38–44. |
| — nav items | inside `site-nav` | 5 links `gap:30px`, `15px`, weight 500 `#4E453A`: Our rooms → `/our-rooms`, Life here → `/life-here`, Our home → `/our-home`, Careers → `/careers`, Contact → `/contact`. **Active** item → color `navy`, weight 700 (source `siteNav.*`, 1366–1372). Source 45–51. |
| — auth buttons | inside `site-nav` | Family login: outline (`border #C9BCA0`, text `navy`, radius `10px`) → `/portal/family`. Staff portal: solid `navy` bg, `cream` text, radius `10px` → `/portal`. Source 52–55, handlers `goFamily`/`goPortal` 1380. |
| Footer | `site-footer` (new, RSC) | `navy-deep` (`#23283F`) bg, text `#C9BFAC`. Grid `1.4fr 1fr 1fr 1fr`, `gap:36px`, `padding:56px 28px 30px`, `max-width:1200px`. 4 columns below. Bottom: top-border row, copyright "© 2026 Wesley Home & Care · Privacy · Terms" (`12.5px`, `#8f846b`). Source 413–427. |

### Footer columns (source 416–425)

1. **Brand** — 36×36 navy logo tile + "Wesley Home & Care" (Newsreader `18px`, `cream`); blurb: "Boutique aged residential care in the heart of Mt Eden, Tāmaki Makaurau. Certified by the Ministry of Health." (`14px`, max-width `280px`).
2. **Our rooms** — heading + VIP suites · Premium suites · Normal rooms · Rest-home care (static text spans).
3. **Our home** — heading + Life here · Our team · Careers · News (static text spans).
4. **Access** — heading + Family login (→ `/portal/family`) · Staff portal (→ `/portal`) · Contact (static). Only the two portal links are interactive; others are plain labels this phase.

## Data consumed

None from `lib/mock-data`. All copy is static/structural and lives in the sub-components (nav item list, footer column config). Nav-item→route map is a local const in `site-nav`. No accessor calls.

## Variants & states

- **Active nav item** — `site-nav` compares `usePathname()` against each item's `href`; active → `navy` + weight 700, inactive → `#4E453A` + weight 500 (mirrors source `siteNav` style object, 1366–1372).
- **Sticky-on-scroll** — nav stays pinned with blur; no scrolled/shrunk variant in the design.
- **Hover** — links/buttons show pointer cursor; no distinct hover color in source (keep subtle, token-based).
- No responsive collapse specified in source (desktop-first). Nav row wraps/stacks gracefully on narrow widths per global DoD; no hamburger this phase.
- No role/auth variant — marketing chrome is identical for everyone.

## Interactions

- **Announcement link** "book a visit this week ›" → navigate `/contact`.
- **Logo** → `/`.
- **Nav items** → their routes (see table). Active state via pathname.
- **Family login** button → `/portal/family`; **Staff portal** button → `/portal` (source `goFamily`/`goPortal`, 1380).
- **Footer** Family login → `/portal/family`, Staff portal → `/portal`.
- Navigation uses `next/link`; no scroll-to-top handler needed (App Router resets scroll on route change — replaces source's manual `window.scrollTo(0,0)`).

## Tokens

- Colors: `navy` (announcement bg, primary button, active nav, logo tile), `gold` (logo "W"), `navy-deep` (footer), `cream`/`cream-2` (nav surface + text on navy), `border` (nav bottom border), `ink`/`muted-2` (wordmark + eyebrow), footer text `#C9BFAC` / divider `#45402F` / copyright `#8f846b` (footer-scoped tokens).
- Radius: logo tile `11px` / `10px` (footer), buttons `10px`, pill `100px` (none here).
- Effects: sticky header `backdrop-filter: blur(10px)` over `cream/.86` (design-system §Spacing/shadow "Sticky headers").
- Type: Newsreader for logo wordmark; Instrument Sans for nav/buttons/footer; eyebrow `letter-spacing:2px` uppercase.

## Out of scope (this phase)

- Footer link columns "Our rooms / Our home" text spans are **inert labels** (no routes) except where they map to real marketing routes — only Access→Family login/Staff portal navigate; others are static.
- "News", "Our team", "Privacy", "Terms" — no target pages; inert.
- No mobile hamburger menu, no search, no i18n language toggle.
- Announcement bar is not dismissible (no close button in design).

## Definition of Done

Beyond global DoD (00-rules §11):

1. Layout renders on all 6 marketing routes; announcement + nav + footer identical across them.
2. `site-nav` is the **only** client island in the layout; announcement + footer stay RSC.
3. Active nav item correctly reflects current route via `usePathname()` for each of the 5 pages.
4. Family login / Staff portal buttons (nav + footer) navigate to `/portal/family` and `/portal`.
5. Sticky nav stays pinned with blur on scroll; no layout shift.
6. Footer 4-column grid matches source column order and copy; copyright row present.
7. Inert footer labels carry no dead `href`; no console errors.
