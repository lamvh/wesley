# Dashboard

- **Route:** `/portal` - `app/portal/page.tsx`
- **Section:** Portal · **Access:** both (admin + staff variants)
- **Render:** thin RSC awaits `getDashboardKpis()` + `getBirthdaysThisMonth()` and passes both into the client `DashboardView`; the role branch happens client-side because role lives in `usePortalRole()`

## Purpose
Landing screen of the portal. An at-a-glance operational picture: live occupancy, headcount and stock across **every** home. Admin and staff see the same figures; only the greeting and the alert list differ.

## Layout
Centered `max-width:1180px` column inside `PortalLayout`'s `<main>`, `16px` vertical rhythm:

1. Header row (greeting + sub, Handover/+New buttons right-aligned).
2. KPI grid - one card per live figure (3 today).
3. Upcoming-birthdays strip.
4. **Needs attention** - full width.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | inline in `dashboard-view` | `greeting` H1 (Newsreader `34px`) + `sub`. Right: "Handover notes" (cream-2 outline) + "+ New entry" (navy fill) - both inert. |
| KPI grid | `kpi-card` × N | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`, `gap:16px`. Each: `label` + value (Newsreader `33px`) + colored `delta` + `sub`. The row renders only the KPIs that have a real source, and is skipped entirely when there are none. |
| Birthdays strip | `birthday-strip` | Single `cream-2` bar: cake-icon header cell ("Upcoming birthdays · This month · N residents"; "None this month" when empty) then one pill per resident with a birthday in the current month. Wraps. |
| Needs attention | `needs-attention` | Card + inert "View all". Each row carries a tone-colored `3px` left border + dot + tag pill; the border color is derived from the tone's text class so it can't drift from the dot/pill. |

## Scope: every home, never one
The dashboard is the whole-organisation view and is **deliberately not scoped to a building** - it is the only portal screen that ignores the building context. Occupancy, residents and birthdays all span Wesley **and** The Lodge; anything that is genuinely single-site says so in its own sub line rather than being silently presented as the whole picture.

## Data consumed
Three sources:
- `getDashboardKpis()` (`lib/data/dashboard.ts`) - **live Supabase**, all homes, not role-branched.
- `getBirthdaysThisMonth()` (`lib/data/residents.ts`) - **live Supabase**, all homes.
- `getDashboard(role)` (`lib/mock-data/dashboard.ts`) → `{ greeting, sub, alerts }` - **still mock**, role-branched.

Fields:
- **`greeting`** / **`sub`** - role-branched strings.
- **`kpis`**: `Kpi[]`, live. Only figures with a real source are returned, so the row length follows the data:
  - **Occupancy** - `rooms` across both homes; `delta` is the vacant count.
  - **Residents** - `residents` across both homes; sub breaks the total down per home so it is checkable.
  - **Low stock** - products whose `stock_levels.qty_now` is under `par`. `par = 0` means no reorder level has been set and is excluded, otherwise every unconfigured item would read as low. Stock is single-site, so the sub line names the store.

  There is deliberately **no "Open incidents" KPI**: there is no incidents table to count, and a hardcoded number beside live occupancy is the failure mode this screen has already been cleaned of twice.
- **`alerts`**: `Alert[]` - `{ title, detail, tag, tone }`, role-branched. `tone` (`warn`/`amber`/`accent`) maps to left-border + tag color/tint via `alertToneMeta`.
- **`birthdays`**: `Birthday[]` - live from `residents(name,room,dob,color)`. Rows whose `dob` month is the current month, sorted by day. `date` = `"20 Jul"` or `"Today"`; `badge` = the ordinal age they turn this year (`93rd`); `room` = `"Room 5 · The Lodge"`. **Covers both homes** - the dashboard is home-wide and room numbers repeat across the two registers. Month/day are read straight off the ISO `dob` string, not a parsed `Date`, so there is no timezone shift.

Colors (delta, alert border/tint, avatar bg) derive in the accessor/helper layer from semantic scales and the avatar palette - JSX references tokens only.

## Variants & states
Admin vs staff differ in **greeting, sub and alerts** only. KPIs and birthdays are identical for both: occupancy and headcount are the same facts whoever is looking, and both are fetched server-side above the role branch. (The staff role used to get its own four KPIs - "My residents 14", "Tasks due 6" - all invented, and none of them derivable from anything currently stored.)

| | Admin (Sarah) | Staff (Aroha) |
|---|---|---|
| `greeting` | "Good morning, Sarah" | "Kia ora, Aroha" |
| Alerts | 4 rows | 3 rows |
| KPIs | identical, live | identical, live |

Other states:
- **Delta tone:** `warn` renders terracotta, else navy - the only status-driven styling in KPI cards.
- **Birthday strip:** empty month renders "None this month" rather than an empty bar.
- **KPI row is skipped entirely** if no figure has a source (e.g. before the schema is seeded) rather than rendering empty cards.

**Loading** (`dashboard-skeleton.tsx`): `DashboardView` is a client island with an explicit `loading` → render transition, re-run on every role switch (the body remounts via `key={role}`). The skeleton mirrors the real layout (header, 3 KPIs, birthday strip, alerts card) and carries `aria-busy`/`aria-live`. `getDashboard(role)` is still synchronous mock; the `~450ms` settle window stands in for the Supabase query that will replace it, so the skeleton path is real. KPIs and birthdays are awaited in the RSC page, so they land with the first content frame.

## Interactions
- "View all" (Needs attention), "Handover notes", "+ New entry" - inert stubs this phase.
- Role change happens in the topbar; this page re-renders with the other variant.

## Tokens
`cream-2` + `border-line` cards (radius `16px`, pad `18-22px`); Newsreader for greeting (`34px`), KPI value (`33px`), card titles (`20px`); `bronze-text` for "View all"; `navy` fill for "+ New entry"; alert **semantic scales** for delta + alert tones; **avatar palette** for birthday initials. Birthday badge/date pill = gold tint.

## Out of scope (this phase)
- **Alerts are still mock strings** - the "Needs attention" rows name residents and incident numbers that exist nowhere in the data. They are the last invented content on this screen.
- No staffing KPI: `staff` and `roster_shifts` are Wesley-only, so a headcount here would claim to cover both homes while counting one.
- "Handover notes", "+ New entry", "View all" are visually present but inert.

## Definition of Done
- `/portal` renders the correct variant for the active role; switching role swaps greeting + sub + the alert set, leaving KPIs and the birthday strip unchanged.
- KPIs come from `getDashboardKpis()` and birthdays from `getBirthdaysThisMonth()`, both covering every home; only greeting/sub/alerts come from `getDashboard(role)`. Colors derived from semantic scales / avatar palette - no raw hex in JSX.
- First paint and each role switch show `DashboardSkeleton`, whose grid matches the loaded layout.
- `tsc` / lint / `next build` clean; no body horizontal scroll; columns stack on narrow widths.

## History
Three blocks have been removed from this screen, each because it presented invented data beside real data:

- **Occupancy by wing** - went with the wing/care-type removal; occupancy was keyed off wing names that no longer exist.
- **Today's programme** - six hardcoded rows ("Garden group", "Birthday afternoon tea · Mei's 90th") with no schedule source behind them.
- **Recent family messages** - three hardcoded posts about Peggy W., George A. and Bill T., **none of whom appear in either register**, sitting directly under live birthday data.

The `TodayProgramme` / `RecentFamilyMessages` components, the `ScheduleItem` type and the `todaySchedule` / `familyPosts` fields on `Dashboard` were deleted with them rather than left as dead code - nothing else consumed them. Git has the markup if a real source ever arrives. The KPI and alert sets are the remaining mock content on this screen.
