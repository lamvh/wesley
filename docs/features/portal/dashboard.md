# Dashboard

- **Route:** `/portal` — `app/portal/page.tsx`
- **Section:** Portal · **Access:** both (admin + staff variants)
- **Source:** lines `484–581` (markup); data `1123–1166`, role-branch KPIs/alerts `1124–1148`
- **Render:** RSC (reads `getDashboard(role)`); role comes from the `usePortalRole()` client island in `PortalLayout` — the page branches on the passed role, no client code of its own

## Purpose
Landing screen of the portal. Gives an at-a-glance operational picture. **Admin** (Sarah, Facility Manager) sees whole-home status across all three wings; **staff** (Aroha, RN on Rātā) sees her shift, residents, and tasks. Same layout skeleton, role-swapped content.

## Layout
Centered `max-width:1180px` column inside `PortalLayout`'s `<main>`. Top→bottom, `16px` vertical rhythm between blocks:

1. Header row (greeting + sub, with Handover/+New buttons right-aligned).
2. KPI grid — 4 cards.
3. Upcoming-birthdays strip.
4. Two-column row: **Needs attention** (`1.5fr`) + **Today's programme** (`1fr`).
5. Two-column row: **Occupancy by wing** (`1fr`) + **Recent family messages** (`1.5fr`).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | (inline in `page.tsx`) | `greeting` H1 (Newsreader `34px`, weight 500) + `sub` (`#6b6255`). Right: "Handover notes" (cream-2 outline) + "+ New entry" (accent-fill) buttons — both inert. `flex`, wraps, `align-items:flex-end`. Source `486–495`. |
| KPI grid | `kpi-card` × 4 | `grid-cols-4`, `gap:16px`, `margin-top:26px`. Each card: `label` + big `value` (Newsreader `33px`) + colored `delta` + `sub` meta. Source `497–509`. |
| Birthdays strip | `birthday-pill` × 4 (+ inline header cell) | Single `cream-2` bar: leading cake-icon header cell ("Upcoming birthdays · Next three weeks · 4 residents") then pills. `flex`, wraps, `gap:16px`. Source `511–524`. |
| Needs attention | `alert-row` × N | Card titled "Needs attention" + "View all" (inert). Rows stacked `gap:10px`. Source `526–539`. |
| Today's programme | (inline schedule rows in `page.tsx`) | Card titled "Today's programme"; each row = `time` (58px, navy, weight 700) + `title` + `where`, divided by `border-2`. Source `540–551`. |
| Occupancy by wing | `occupancy-bar` × 3 | Card; per wing: label + `filled/total` + progress track (`#EAE0CE`) with colored fill to `pct`. Source `555–566`. |
| Recent family messages | `family-message-row` × 3 | Card titled "Recent family messages" + "Open portal" → `/portal/family`; rows = avatar + `from · resident` + `preview` + `time`. Source `567–579`. |

## Data consumed
Single accessor `getDashboard(role)` (`lib/mock-data/dashboard.ts`) → `{ greeting, sub, kpis, alerts, todaySchedule, wings, familyPosts, birthdays }`. Static — no "today" computation.

- **`greeting`** / **`sub`** — role-branched strings (`1124–1127`).
- **`kpis`**: `Kpi[]` — `{ label, value, delta, deltaTone, sub }`; role-branched set of 4 (`1128–1138`). `deltaTone` → color token (`accent` = navy, `warn` = terracotta `#BE7350`), derived not stored as hex.
- **`alerts`**: `Alert[]` — `{ title, detail, tag, tone }`; role-branched (`1139–1148`). `tone` (`warn`/`amber`/`accent`) maps to left-border + tag color/tint via a helper.
- **`todaySchedule`**: `{ time, title, where }[]` — shared, 6 items (`1149–1156`).
- **`wings`**: `OccupancyWing[]` — `{ name, filled, total, colorKey }`; 3 wings, `pct` derived `filled/total` (`1157–1161`).
- **`familyPosts`**: `FamilyPost[]` subset — `{ from, resident, initials, colorKey, preview, time }`; 3 items (`1162–1166`).
- **`birthdays`**: `Birthday[]` — `{ name, room, date, initials, colorKey, badge }`; 4 items (`1347–1352`).

Colors (`deltaColor`, alert border/tint, wing fill, avatar bg) are derived in the accessor/helper layer from semantic scales / avatar palette — JSX references tokens only.

## Variants & states

**Admin vs staff differ in header + KPIs + alerts** (source `1124–1148`). `todaySchedule`, `wings`, `familyPosts`, `birthdays` are identical for both.

| | Admin (Sarah) | Staff (Aroha) |
|---|---|---|
| `greeting` | "Good morning, Sarah" | "Kia ora, Aroha" |
| `sub` | "Here's how the home is running today across all three wings." | "You're on the Rātā (Normal) morning shift — here's what needs you." |
| KPI 1 | Occupancy · 94% · +2% · 51 of 54 suites | My residents · 14 · Rātā · Rooms 05–18 |
| KPI 2 | Staff on shift · 12 · Full · 3 RNs · 9 carers | Tasks due · 6 · 2 now · Meds, obs, care notes |
| KPI 3 | Low stock alerts · 5 · 2 urgent (warn) · Across 3 categories | Shift ends · 3:00 · 4h left · Afternoon handover |
| KPI 4 | Open incidents · 3 · 1 new (warn) · None high severity | Activities · 3 · Today · Garden, choir, quiz |
| Alerts | 4 rows: glove reorder, open Sunday-night shift, Harry fall (INC-0432), Peggy GP review | 3 rows: Peggy 9am meds (Now), Harry post-fall obs (Obs), Joan care note pending (Note) |

Other states:
- **Delta tone:** `warn` deltas render terracotta (`#BE7350`), else navy — the only status-driven styling in KPI cards.
- **Alert tone:** drives the `3px` left border + dot + tag color/tint (warn=terracotta, amber=`#b0894a`, accent=navy-sage).
- **Occupancy fill:** width = `pct`; a wing at `100%` (Tōtara) fills the whole track.
- No empty states — dashboard always has data both roles.
- Hover: cards/rows are static (no per-row hover nav this phase).

## Interactions
- **"Open portal"** (family card header) → `/portal/family`. Real nav.
- **"View all"** (Needs attention) — inert stub this phase.
- **"Handover notes"** / **"+ New entry"** header buttons — inert stubs.
- **Role change** happens in the topbar `role-toggle`; this page re-renders with the other variant. No in-page toggle.

## Tokens
`cream-2` + `border` (all cards, radius `16px`, pad `18–22px`); Newsreader for greeting (`34px`) + KPI value (`33px`) + card titles (`20px`); `bronze-text` (`#B07C22`) for "View all"/"Open portal" links; `accent` (navy) fill for "+ New entry"; alert/stock/care **semantic scales** for delta + alert tones; **avatar palette** for birthday/family initials backgrounds; occupancy fill uses wing colors (`#3F5137` sage, navy, gold `#8A6516`); track `#EAE0CE`, dividers `border-2`. Birthday badge/date pill = gold tint (`#F3E8CE`/`#8A6516`).

## Out of scope (this phase)
- "Handover notes", "+ New entry", "View all" buttons — visually present, inert.
- All values static; deltas ("+2%", "1 new"), "Shift ends 3:00", dates are fixed strings, no live data or "today" logic.

## Definition of Done
- `/portal` renders the correct variant for the active role; toggling role in the topbar swaps greeting + sub + all 4 KPIs + the alert set, leaving schedule/occupancy/family/birthdays unchanged.
- Layout matches source `484–581`: 4-col KPIs, single birthdays strip, `1.5fr/1fr` then `1fr/1.5fr` two-col rows, `16px` gaps.
- All content via `getDashboard(role)`; colors derived from semantic scales/avatar palette — no inline fixtures, no raw hex in JSX.
- "Open portal" navigates to `/portal/family`; inert buttons noted above do nothing.
- Named sub-components exist: `kpi-card`, `birthday-pill`, `alert-row`, `occupancy-bar`, `family-message-row`.
- `pnpm build` + `pnpm lint` clean; no body horizontal scroll; columns stack sensibly on narrow widths.
