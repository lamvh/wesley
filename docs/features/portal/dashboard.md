# Dashboard

- **Route:** `/portal` - `app/portal/page.tsx`
- **Section:** Portal · **Access:** both (admin + staff variants)
- **Render:** thin RSC awaits `getBirthdaysThisMonth()` and passes it into the client `DashboardView`; the role branch happens client-side because role lives in `usePortalRole()`

## Purpose
Landing screen of the portal. An at-a-glance operational picture: **admin** sees whole-home status, **staff** sees their shift. Same layout, role-swapped content.

## Layout
Centered `max-width:1180px` column inside `PortalLayout`'s `<main>`, `16px` vertical rhythm:

1. Header row (greeting + sub, Handover/+New buttons right-aligned).
2. KPI grid - 4 cards.
3. Upcoming-birthdays strip.
4. **Needs attention** - full width.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `dashboard-view` | `greeting` H1 (Newsreader `34px`) + `sub`. Right: "Handover notes" (cream-2 outline) + "+ New entry" (navy fill) - both inert. |
| KPI grid | `kpi-card` × 4 | `grid-cols-2 md:grid-cols-4`, `gap:16px`. Each: `label` + value (Newsreader `33px`) + colored `delta` + `sub`. |
| Birthdays strip | `birthday-strip` | Single `cream-2` bar: cake-icon header cell ("Upcoming birthdays · This month · N residents"; "None this month" when empty) then one pill per resident with a birthday in the current month. Wraps. |
| Needs attention | `needs-attention` | Card + inert "View all". Each row carries a tone-colored `3px` left border + dot + tag pill; the border color is derived from the tone's text class so it can't drift from the dot/pill. |

## Data consumed
Two sources:
- `getDashboard(role)` (`lib/mock-data/dashboard.ts`) → `{ greeting, sub, kpis, alerts }` - **still mock**, role-branched, no "today" computation.
- `getBirthdaysThisMonth()` (`lib/data/residents.ts`) - **live Supabase**, awaited in the RSC page.

Fields:
- **`greeting`** / **`sub`** - role-branched strings.
- **`kpis`**: `Kpi[]` - `{ label, value, delta, deltaTone, sub }`, 4 per role. `deltaTone` → color token (`accent` navy, `warn` terracotta), derived not stored.
- **`alerts`**: `Alert[]` - `{ title, detail, tag, tone }`, role-branched. `tone` (`warn`/`amber`/`accent`) maps to left-border + tag color/tint via `alertToneMeta`.
- **`birthdays`**: `Birthday[]` - live from `residents(name,room,dob,color)`. Rows whose `dob` month is the current month, sorted by day. `date` = `"20 Jul"` or `"Today"`; `badge` = the ordinal age they turn this year (`93rd`); `room` = `"Room 5 · The Lodge"`. **Covers both homes** - the dashboard is home-wide and room numbers repeat across the two registers. Month/day are read straight off the ISO `dob` string, not a parsed `Date`, so there is no timezone shift.

Colors (delta, alert border/tint, avatar bg) derive in the accessor/helper layer from semantic scales and the avatar palette - JSX references tokens only.

## Variants & states
Admin vs staff differ in **header + KPIs + alerts** only. Birthdays are identical for both (one server-side fetch, above the role branch).

| | Admin (Sarah) | Staff (Aroha) |
|---|---|---|
| `greeting` | "Good morning, Sarah" | "Kia ora, Aroha" |
| KPI 1 | Occupancy · 94% | My residents · 14 |
| KPI 2 | Staff on shift · 12 | Tasks due · 6 |
| KPI 3 | Low stock alerts · 5 (warn) | Shift ends · 3:00 |
| KPI 4 | Open incidents · 3 (warn) | Activities · 3 |
| Alerts | 4 rows | 3 rows |

Other states:
- **Delta tone:** `warn` renders terracotta, else navy - the only status-driven styling in KPI cards.
- **Birthday strip:** empty month renders "None this month" rather than an empty bar.
- No other empty states - both roles always have KPI and alert data.

**Loading** (`dashboard-skeleton.tsx`): `DashboardView` is a client island with an explicit `loading` → render transition, re-run on every role switch (the body remounts via `key={role}`). The skeleton mirrors the real layout (header, 4 KPIs, birthday strip, alerts card) and carries `aria-busy`/`aria-live`. `getDashboard(role)` is still synchronous mock; the `~450ms` settle window stands in for the Supabase query that will replace it, so the skeleton path is real. Birthdays are already awaited in the RSC page, so they land with the first content frame.

## Interactions
- "View all" (Needs attention), "Handover notes", "+ New entry" - inert stubs this phase.
- Role change happens in the topbar; this page re-renders with the other variant.

## Tokens
`cream-2` + `border-line` cards (radius `16px`, pad `18-22px`); Newsreader for greeting (`34px`), KPI value (`33px`), card titles (`20px`); `bronze-text` for "View all"; `navy` fill for "+ New entry"; alert **semantic scales** for delta + alert tones; **avatar palette** for birthday initials. Birthday badge/date pill = gold tint.

## Out of scope (this phase)
- KPIs and alerts are still mock strings - no live occupancy, staffing, stock or incident counts.
- "Handover notes", "+ New entry", "View all" are visually present but inert.

## Definition of Done
- `/portal` renders the correct variant for the active role; switching role swaps greeting + sub + 4 KPIs + the alert set, leaving the birthday strip unchanged.
- Birthday strip is fed by `getBirthdaysThisMonth()`; everything else by `getDashboard(role)`. Colors derived from semantic scales / avatar palette - no raw hex in JSX.
- First paint and each role switch show `DashboardSkeleton`, whose grid matches the loaded layout.
- `tsc` / lint / `next build` clean; no body horizontal scroll; columns stack on narrow widths.

## History
Three blocks have been removed from this screen, each because it presented invented data beside real data:

- **Occupancy by wing** - went with the wing/care-type removal; occupancy was keyed off wing names that no longer exist.
- **Today's programme** - six hardcoded rows ("Garden group", "Birthday afternoon tea · Mei's 90th") with no schedule source behind them.
- **Recent family messages** - three hardcoded posts about Peggy W., George A. and Bill T., **none of whom appear in either register**, sitting directly under live birthday data.

The `TodayProgramme` / `RecentFamilyMessages` components, the `ScheduleItem` type and the `todaySchedule` / `familyPosts` fields on `Dashboard` were deleted with them rather than left as dead code - nothing else consumed them. Git has the markup if a real source ever arrives. The KPI and alert sets are the remaining mock content on this screen.
