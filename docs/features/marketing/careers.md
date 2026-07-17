# Careers

- **Route:** `/careers` - `app/(marketing)/careers/page.tsx`
- **Section:** Marketing · **Access:** both
- **Source:** lines `339–377` (data `1445–1455`)
- **Render:** RSC (no client islands)

## Purpose
Public recruitment page. Communicates the team culture, lists the benefits of working at Wesley and the current open roles, and routes candidates to make contact.

## Layout
Inside `MarketingLayout` (announcement + sticky nav + footer assumed). Body, top to bottom:
1. Header band (eyebrow + title + lede).
2. Benefits grid (3 cards).
3. Open roles list (stacked rows, each with Apply).
4. "Don't see your role" dashed note.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header band | `MarketingPageHeader` (shared, reused from our-home) | `eyebrow="Careers"`, title "Come and do work that matters", lede. `cream-2` band, bottom `border`. Lines `341–347`. |
| Benefits | `BenefitGrid` → `BenefitCard` (new) | Grid `repeat(3,1fr)` gap `18px` (3 cards). Card: `cream-2` bg, `border`, radius `16px`, pad `26px`, `b.title` (Newsreader 21) + `b.desc`. Section pad `56px/28px 20px`. Lines `348–357`. |
| Open roles | `RoleList` → `RoleRow` (new) | H2 "Open roles" + vertical stack gap `12px`. Row: `cream-2` bg, `border`, radius `14px`, pad `20px/24px`, flex `align:center` gap `20px`, wrap. Left (`flex:1`, min `220px`): `r.title` (Newsreader 20) + `r.type` (muted-2) + `r.desc`. Right: "Apply now" button → `/contact`. Lines `358–371`. |
| No-role note | `RoleEnquiryNote` (new, or inline in page) | Dashed `border`, `cream-2` bg, radius `14px`, pad `22px/24px`, centered. Copy with "get in touch" link → `/contact`. Lines `372–374`. |

Reused: `MarketingPageHeader`. New: `BenefitCard`, `RoleRow`, note block.

## Data consumed
Accessor `getMarketingContent()` (`lib/mock-data/marketing-content.ts`):
- `benefits` - 3× `{ title, desc }` (source `1451–1455`).
- `roles` - 4× `{ title, type, desc }`; `type` = employment/wing line e.g. "Full-time · Kōwhai wing" (source `1445–1450`).

Header copy ("Come and do work that matters") and note copy are static screen content.

## Variants & states
- No role/auth differences - public page.
- No empty states - `benefits` (3) and `roles` (4) always present. (If `roles` were empty, the no-role note still stands as the fallback CTA.)
- Hover: benefit/role cards static; "Apply now" + "get in touch" get pointer + button/link hover per token.

## Interactions
- Per-role "Apply now" button → `next/link` `/contact` (design `navContact`, line `368`).
- "get in touch" inline link in note → `/contact` (line `373`).
- No form on this page.

## Tokens
`cream-2` (header + all card surfaces) · `border` (card borders; dashed variant on note) · `bronze-text` (eyebrow) · `navy` (Apply button bg, "get in touch" link accent) · `cream` (Apply button label) · `ink` (role/benefit titles) · `muted` (body) · `muted-2` (role `type` meta). Newsreader: H1 `46px`, H2 `30px`, role title `20px`, benefit title `21px`. Radius: benefit card `16px`, role row + note `14px`, button `11px`. Section pad `56px/28px`, `max-width:1200px`.

## Out of scope (this phase)
- No application form / job-detail pages - "Apply now" only navigates to `/contact`; no ATS, upload, or mutation.
- No filtering/search of roles.

## Definition of Done
Beyond global DoD (00-rules §11):
- `/careers` renders header, 3 benefit cards, 4 role rows, dashed note in order matching lines `339–377`.
- All benefits + roles come from `getMarketingContent()`; none inlined.
- Every "Apply now" and "get in touch" navigates to `/contact`.
- Reuses shared `MarketingPageHeader`.
- Role rows wrap gracefully and grid collapses to one column on narrow widths; no horizontal body scroll.
