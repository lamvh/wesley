# Family portal

- **Route:** `/portal/family` - `app/portal/family/page.tsx`
- **Section:** Portal · **Access:** both
- **Source:** lines `863–908` (screen) + `1291–1307` (`familyFeed`, `visits`, `messages` data)
- **Render:** RSC (no client islands - static content, inert button only)

## Purpose
Shared whānau-facing feed: staff updates about residents, upcoming family visits, and messages, so both admin and care staff (and, later, families) can see what's shared with whānau. Accessible to both roles (source `pFamily`); also the marketing "Family login" target.

## Layout
Single centred column inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Header row** - flex, title/subtitle left, "+ Post an update" button right (`align-items:flex-end`, `space-between`, wraps).
2. **Two-column body** - grid `1.6fr 1fr`, gap `16px`, margin-top `22px`:
   - **Left (feed)** - `flex-col`, gap `14px`; one `family-post` per `familyFeed` entry.
   - **Right (sidebar)** - `flex-col`, gap `14px`; "Upcoming visits" card over "Messages" card.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | `PortalPageHeader` (shared) | `title` "Family portal" (Newsreader `32px`/500); `subtitle` "Updates, visits & messages shared with whānau" (`muted` `15px`); `action` slot. Source 866. |
| Post-update button | `Button` (shadcn, `variant=primary`) | Accent fill, cream text, radius `11px`, pad `9px 16px`, `14px`/600. Label "+ Post an update". Inert this phase. Source 867. |
| Feed column | `page.tsx` left grid cell | `flex-col` gap `14px`. Maps `familyFeed` → `family-post`. Source 870–884. |
| Family post (×3) | `family-post` (new `components/portal/family-post.tsx`) | `cream-2` surface, `border` outline, radius `16px`, pad `18px`. Head row (flex gap `12px`, centre): 40×40 avatar circle (initials, bg `p.color`, white text `13px`/700) · resident+by block (flex `1`; resident `14.5px`/600 `ink`, "{by} · {time}" `muted-2` `12.5px`) · tag pill (`p.tag`, sage `#3F5137`/`#E5EBDD`, radius pill). Body text `14.5px`/1.62 `#4E453A`, margin-top `14px`. Optional photo. Source 872–882. |
| Post photo (conditional) | `Photo` (shared `components/shared/photo.tsx`) | Rendered only when `p.hasPhoto`; `160`-ish frame `height:180px`, radius `12px`, `overflow:hidden`, margin-top `14px`. `<Photo slot={p.slot} shape="rect" alt=.../>`; labelled placeholder fallback "Photo for whānau". Source 879–881. |
| Visits card | `page.tsx` sidebar + `visit-row` | `cream-2`/`border` card radius `16px`, pad `20px`. Title "Upcoming visits" (Newsreader `19px`/600). List `flex-col`; maps `visits` → `visit-row`. Source 886–896. |
| Visit row (×4) | `visit-row` (new `components/portal/visit-row.tsx`) | Flex gap `13px`, centre, pad `11px 0`, `border-2` bottom divider. Date badge (width `44px`, centre): month (`v.mon`, `11px`/700 uppercase `bronze-text`) over day (`v.day`, Newsreader `20px` `ink`). Detail block (flex `1`): who (`14px`/600 `ink`), detail (`muted-2` `12.5px`). Source 890–893. |
| Messages card | `page.tsx` sidebar + `message-row` | `cream-2`/`border` card radius `16px`, pad `20px`. Title "Messages" (Newsreader `19px`/600). List `flex-col`; maps `messages` → `message-row`. Source 897–904. |
| Message row (×3) | `message-row` (new `components/portal/message-row.tsx`) | pad `11px 0`, `border-2` bottom divider. Line 1: "{from}" (`13.5px`/600 `ink-soft`) " · {time}" (regular). Line 2: `m.text` (`13px` `#7a7163`, margin-top `3px`). Source 900–901. |

## Data consumed
From `lib/mock-data/family.ts` (see 03-data-model.md):
- `getFamilyFeed()` → `FamilyPost[]` (3, source order Peggy → George → Bill). Fields: `resident`, `by`, `time`, `tag`, `initials`, `colorKey` (`color`), `text`, optional `photoSlot` (`slot`; present when photo shown). Source `familyFeed` lines 1292–1296. Photo presence derived from `photoSlot` being set (mirrors source `hasPhoto`): posts 1 & 3 have photos (`vme-feed1`, `vme-feed2`), post 2 none.
- `visits` → `Visit[]` (4, source order Sun 12 → Thu 16). Fields: `mon`, `day`, `who`, `detail`. Source lines 1297–1302.
- `messages` → `Message[]` (3, source order). Fields: `from`, `time`, `text`. Source lines 1303–1307.

## Variants & states
- **No role variance** - identical for admin and staff (source `pFamily` has no `isAdmin` branch); nav item shown for both. Accessible to both per 02-architecture route map.
- **Photo present/absent** - post renders photo frame only when `photoSlot` set; otherwise text-only card (George Aleki, source `hasPhoto:false`).
- **Photo fallback** - unmapped slot → labelled placeholder "Photo for whānau" (source `placeholder`, line 880).
- **Static lists** - 3 posts, 4 visits, 3 messages; no empty/loading state (mock data fixed).
- **Tag pill** - sage colour is fixed in source (single tint for all tags: Wellbeing / Activity), not a multi-value semantic scale.
- **Avatar** - initials on `colorKey` palette bg (avatar palette, 01-design-system.md).
- Responsive: `1.6fr 1fr` grid stacks (feed above sidebar) on narrow widths; no horizontal body scroll.

## Interactions
- **+ Post an update** button - inert this phase (`console`-noop; static button source line 867). No composer/form.
- No post/visit/message clicks, replies, filters, or search - all read-only display (source has no handlers).
- Sidebar nav + role toggle come from `PortalLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards, `border` (`#E7DECD`) outlines, `border-2` (`#EEE6D6`) visit/message row dividers.
- Tag pill: sage `#3F5137` on `#E5EBDD` (from care-tier/activity sage; single fixed tint here).
- Avatar bg: `colorKey` from the avatar palette (`#6E875E #b06a5a #5b8f9a` …), white initials.
- Text: `ink` (`#2B2720`) resident/who names, `ink-soft` (`#3B362D`) message-from, `#4E453A` post body, `#7a7163` message text, `muted-2` (`#948B7B`) by/time/detail, `bronze-text` (`#B07C22`) visit month.
- Accent: `accent` (navy) primary button; `cream` button text.
- Type: Newsreader H1 `32px`/500, card titles `19px`/600, visit day `20px`; Instrument Sans body/labels/pills.
- Radius: cards `16px`, photo frame `12px`, button `11px`, tag pill `100px`. Column gap `16px`, card gap `14px`, main pad `30px`, `max-width:1180px`.

## Out of scope (this phase)
- **+ Post an update** button - visually present, inert (no composer, no mutation).
- No message reply/compose, visit scheduling/RSVP, or post reactions.
- No filtering, search, or pagination of feed/visits/messages.
- Photos may render as placeholders until slot→file mapping is populated in `lib/mock-data/photos.ts`.
- No real family authentication (route reachable via portal; "Family login" is nav only - see 02-architecture).

## Definition of Done
Beyond global DoD (00-rules §11):
1. Two-column grid `1.6fr 1fr` renders: 3 `family-post`s left, Upcoming visits + Messages cards right.
2. Each `family-post` shows avatar (initials on `colorKey`), resident, "{by} · {time}", tag pill, body text; photo frame only when `photoSlot` set (posts 1 & 3, not 2).
3. 4 `visit-row`s (month/day badge + who/detail) and 3 `message-row`s (from · time + text) render in source order.
4. All data via `getFamilyFeed()` / `visits` / `messages` accessors - no inline fixtures; no raw hex in JSX.
5. Identical render for admin and staff; nav item shown for both.
6. Layout/tokens match source 863–908 (grid, gaps, radii, sage tag pill, avatar palette).
