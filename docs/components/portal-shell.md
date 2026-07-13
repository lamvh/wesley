# Portal shell (PortalLayout)

- **Component:** `PortalLayout` — `app/portal/layout.tsx`
- **Section:** Portal · **Wraps:** every `/portal/**` route
- **Source:** wrapper lines `433–435`; sidebar `436–462`; topbar `466–479`; nav/role/me logic `1064–1085`, `1354–1411`
- **Render:** RSC shell (fixed navy sidebar + cream topbar + `<main>`) with three small client islands (see below)

## Purpose
Shared chrome for the staff/admin portal: fixed left navigation, sticky topbar with role toggle, and the scrolling content region every portal screen renders into. Establishes the admin-vs-staff experience (nav visibility, identity, console name) via a single client role context so no screen prop-drills the role.

## Layout
`flex` row, `min-height:100vh`:

1. **Sidebar** — `aside`, fixed `256px`, `navy-deep` (`#232A4C`) background, `sticky top-0 h-screen`, `flex-col`, pad `18px 14px`. Top→bottom: logo block → scrollable nav list (`flex:1`, `overflow-y-auto`) → `me` identity footer (top border `#39406A`).
2. **Main column** — `flex:1`, `min-w-0`, `flex-col`: sticky topbar on top, then scrollable `<main>` (`overflow-y-auto`, pad `30px`) holding `{children}`. Each page self-centers its own `max-width:1180px` container.

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Logo → site | (inline in `portal-sidebar`) | `36px` gold-tile "W" (Newsreader) + "Wesley" wordmark + `consoleName` eyebrow (uppercase, `#8B92B4`). Whole block links to `/`. |
| Primary nav | `portal-sidebar` → `sidebar-nav-item` × N | Dashboard, Rooms*, Residents, Roster & shifts, Meals & dietary, Activities, Family portal. `gap:3px`. Each item = icon + label. |
| Admin group | `portal-sidebar` (conditional) | "Administration" subheading (uppercase, `#7C83A6`, pad `16px 12px 6px`) + Stock & supplies, Incidents & compliance. |
| Identity footer | `portal-sidebar` (inline) | `34px` round avatar (`meColor` bg, `meInitials`) + `meName` + `meRoleLabel`. |
| Search box | `portal-topbar` (inline) | Inert. `cream-2` field, `field` border, radius `11px`, search icon + placeholder "Search residents, staff, stock…". |
| Role toggle | `portal-topbar` → `role-toggle` | Pill segmented control (`#EDE4D2` track) with Admin / Staff buttons. |
| Date + wings | `portal-topbar` (inline) | Right-aligned static "Saturday, 11 July" + "Kōwhai · Rātā · Tōtara". |
| View website | `portal-topbar` (inline) | Outline button (`navy` text, `#C9BCA0` border) → `/`. |

`*` Rooms + the whole Administration group are admin-only.

## Sub-components

- **`portal-sidebar`** (`components/portal/portal-sidebar.tsx`) — client island. Renders logo, nav list, admin group, and identity footer. Reads `usePortalRole()` for role (gates admin items + picks `me*`/`consoleName`) and `usePathname()` for the active item. Keep the whole sidebar client because both role and pathname are client concerns; nav data (labels/icons/hrefs) is a static array so this file stays small.
- **`portal-topbar`** (`components/portal/portal-topbar.tsx`) — RSC shell hosting the inert search box, `role-toggle` island, static date/wings, and the "View website" link. Nothing here needs client except the nested toggle.
- **`role-toggle`** (`components/portal/role-toggle.tsx`) — client island. Two-button pill bound to `usePortalRole()`; clicking sets `admin`/`staff`. Active button styled per `rolePill(on)` (source `1077–1085`): `cream-2` bg + subtle shadow when on, muted transparent when off.
- **`sidebar-nav-item`** (`components/portal/sidebar-nav-item.tsx`) — presentational `<Link>` taking `{ href, label, icon, active }`. Active = `gold-deep` (`#D99A3C`) pill with `navy-deep` (`#232A4C`) text weight 600; inactive = transparent with `#B9BFD4` text weight 500 (source `1064–1076`). Icon is a `19×19` inline SVG from the shared icon set.

## Role context (client)

- **`PortalRoleProvider`** + **`usePortalRole()`** live in `lib/role-context.tsx` (`"use client"`). Provider wraps the portal subtree inside `PortalLayout`; it is **not** global (marketing pages never mount it). Shape: `{ role: 'admin' | 'staff'; setRole(r) }`, default `'admin'`, not persisted this phase.
- Consumers: `role-toggle` (reads + sets), `portal-sidebar` (reads for nav gating + identity), and portal `page.tsx` files that branch on role (e.g. Dashboard variant, admin-only empty state).

### Role-derived values (source `1354–1411`)

| Value | Admin | Staff |
|-------|-------|-------|
| `consoleName` (sidebar eyebrow) | Admin Console | Care Station |
| `meName` | Sarah Beckett | Aroha Ngata |
| `meRoleLabel` | Facility Manager | Registered Nurse · Rātā |
| `meInitials` | SB | AN |
| `meColor` (avatar bg) | `#BE7350` | `#6E875E` |
| Admin-only nav (Rooms, Stock, Incidents) | shown | hidden |

Derive these in the accessor/helper layer (e.g. `getPortalIdentity(role)`) — not inline in JSX.

## Client vs server split

- **Server (default):** `PortalLayout` frame, `portal-topbar` shell, search box, date/wings block, "View website" link, `<main>` wrapper.
- **Client islands (smallest possible):** `PortalRoleProvider` (holds state), `role-toggle` (toggles it), `portal-sidebar` (active-nav via `usePathname` + role gating). No page is marked client wholesale.

## Interactions

- **Logo / "View website"** → navigate to `/` (`goSite`, source `1374`, `438`, `478`).
- **Nav items** → their portal routes (`/portal`, `/portal/rooms`, `/portal/residents`, …); active item resolved from `usePathname()`.
- **Role toggle** → flips context role; sidebar + dashboard re-render immediately, no navigation.
- **Search box** → inert (display-only placeholder, no input). Stub this phase.

## Tokens
`navy-deep` (sidebar bg), `gold-deep` (active nav pill), `bronze`/gold tile (logo mark), `cream`/`.9` + `blur(8px)` (sticky topbar), `cream-2` + `field` (search + role-on button), `border`/`E7DECD` (topbar divider), avatar-palette entries for `meColor`, `muted`/`muted-2` for eyebrow + meta. Radius: nav/inputs `11px`, pills `100px`, logo tile `10px`. Icons: `19×19`, `stroke-width 1.8`, `currentColor` (source `1060–1062`).

## Out of scope (this phase)
- Search box — inert, no query, no results.
- Role state not persisted (resets on reload); no auth, no route guards. Admin-only routes visited as staff show an "Admin only" empty state, not a redirect.
- Date/wings are static strings (no "today" computation).

## Definition of Done
- Sidebar fixed + independently scrollable; topbar sticky with `blur` over `cream/.9`; `<main>` scrolls without body horizontal scroll.
- Toggling Staff hides Rooms + the entire Administration group and swaps `me*` identity + `consoleName`; toggling back restores them — no reload, no nav.
- Active nav item shows the `gold-deep` pill matching the current route via `usePathname`.
- Role read only through `usePortalRole()`; identity/nav data from accessors, no inline fixtures, no raw hex in JSX.
- RSC/client boundary as specified; `pnpm build` + `pnpm lint` clean.
