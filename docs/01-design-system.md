# 01 · Design System

All tokens extracted from `.design-src/victoria-all-screens.html`. Implement as CSS variables in `globals.css` (Tailwind v4 `@theme`) + shadcn theme. **JSX references tokens, never raw values.**

## Palette — primitives

| Token | Hex | Where |
|-------|-----|-------|
| `navy` | `#2C3563` | primary brand, buttons, links, accent default |
| `navy-deep` | `#232A4C` / `#23283F` | portal sidebar, footer |
| `gold` | `#E4B45C` | logo mark, "new" accents on navy |
| `gold-deep` | `#D99A3C` | active portal nav pill, staff badge |
| `bronze` | `#B88A34` | portal logo, wing labels |
| `bronze-text` | `#B07C22` | eyebrow labels, "learn more" links |
| `cream` | `#F4EEE2` | app background, cards on navy |
| `cream-2` | `#FCFAF4` | raised card surface |
| `cream-3` | `#EBE3D3` | board/canvas background |
| `ink` | `#2B2720` | primary text |
| `ink-soft` | `#3B362D` | strong body text |
| `muted` | `#6b6255` / `#5B5347` | secondary text |
| `muted-2` | `#857B6C` / `#948B7B` | tertiary/meta text |
| `border` | `#E7DECD` | card borders |
| `border-2` | `#EAE0CE` / `#EEE6D6` | inner dividers |
| `field` | `#DDD1BB` | input borders |

## Palette — semantic scales

Named scales for status. **Never hardcode these per screen** — reference by name.

**Care tier** (room/resident): Normal → text `#3F5137` / tint `#E5EBDD` (sage) · Premium → `#2C3563` / `#E4E6F2` (navy) · VIP → `#8A6516` / `#F3E8CE` (gold).

**Incident severity:** Low → sage `#3F5137`/`#E5EBDD` · Moderate → amber `#b0894a`/`#EDE6D3` · High → rust `#a4432f`/`#F3DAD2`.

**Stock / alert level:** In stock → sage `#6E875E`/`#E5EBDD` · Low → amber `#b0894a`/`#EDE6D3` · Reorder → terracotta `#BE7350`/`#F1E0D3`.

**Shift/room status:** Full/Occupied → sage · Open/Respite → gold `#8A6516`/`#F3E8CE` · Available → navy-muted `#4A5488`/`#E4E6F2` · Maintenance → rust `#93502F`/`#F1E0D3`.

**Activity categories** (dot + tint): garden `#3F5137`/`#E5EBDD` · music `#8a4b6b`/`#F2DEE8` · move `#6b5a2c`/`#EDE6D3` · social `#93502F`/`#F1E0D3` · craft `#3d6b74`/`#E1EAEC` · care/wellbeing `#2C3563`/`#E4E6F2` · faith `#8A6516`/`#F3E8CE`.

**Avatar palette** (resident/staff initials bg): `#6E875E #BE7350 #8a6ba3 #5b8f9a #c08a3e #9a7b4f #7e9b6a #b06a5a #6e879e #2C3563 #B88A34`.

## Typography

Two families via `next/font`:
- **Newsreader** (serif) — weights 400/500/600, optical sizing. Headings, page titles, display numbers (KPI values), quotes. Hero H1 `62px`, page H1 `46px`, section H2 `40-42px`, portal H1 `32-34px`, card titles `19-23px`, KPI numbers `30-33px`.
- **Instrument Sans** (sans) — 400/500/600/700. Body, labels, buttons, meta. Body `15-18.5px`, UI `13-15px`, eyebrow `12-13px` uppercase `letter-spacing:2px`, meta `11.5-12.5px`.

Define as a fluid/utility type scale; keep the design's exact sizes as the desktop reference.

## Spacing, radius, shadow

- Radius: pill `100px` · cards `14-18px` · large panels `20-24px` · inputs/buttons `10-12px` · logo tile `10-15px`.
- Card border: `1px solid border`. Section rhythm: portal cards gap `16px`; marketing sections pad `60-88px` vertical, `28px` horizontal, `max-width:1200px`. Portal main pad `30px`, `max-width:1180px`.
- Shadows: card hover `0 8px 20px -12px rgba(0,0,0,.18)`; hero/float `0 24-30px 60px -28px rgba(...,.5)`.
- Sticky headers: `backdrop-filter: blur(8-10px)` over `cream/.86-.9`.

## Icons

Inline SVG, 19×19, `stroke-width:1.8`, `currentColor`, rounded caps. Set: home, residents, roster (calendar), meals (cutlery), activities (clock), family (chat), stock (box), incidents (triangle-alert), search, cake, rooms (building). Package as a typed `Icon` component / set in `components/shared/icons.tsx` (mirror the exact SVG paths in the source, lines 1393–1405).

## shadcn/ui mapping

`button` (primary=navy, secondary=outline on cream, ghost) · `input` `textarea` `select` (cream field, `field` border) · `card` (cream-2 + border) · `badge` (semantic tints) · `avatar` (initials, palette bg) · `separator` · `table` (incidents/stock). Theme shadcn CSS vars to the tokens above; do not ship default shadcn colors.

## Accent theming

Portal `accent` defaults to `navy`; design exposes alternates (`#D99A3C #3A4675 #5B6EA8`). Implement `accent` as a CSS var consumed by primary portal buttons + active states so it can be re-themed centrally.
