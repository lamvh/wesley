# Portal shell (PortalLayout)

- **Component:** `PortalLayout` — `app/portal/layout.tsx`
- **Section:** Portal · **Wraps:** every `/portal/**` route
- **Source:** wrapper lines `433–435`; sidebar `436–462`; topbar `466–479`; nav/role/me logic `1064–1085`, `1354–1411`
- **Render:** RSC shell (fixed navy sidebar + cream topbar + `<main>`) with three small client islands (see below)

## Purpose
Shared chrome for the staff/admin portal: fixed left navigation, sticky topbar (search + sign-out), and the scrolling content region every portal screen renders into. Access is gated by **Supabase Auth** (middleware guards `/portal/**` — see `docs/features/portal/login.md`) **and by role assignment**: `PortalLayout` is an async RSC that looks up the signed-in user's `app_users` row and shows an "access not provisioned" screen to anyone without an active assignment. Nav visibility / identity / console name derive from a client role context (`usePortalRole`) whose `initialRole` is now derived server-side from `app_users.role_id`; the manual Admin/Staff toggle and the Lodge/Wesley building switch have been **removed**.

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
| Search box | `portal-topbar` (inline) | Real focusable `<input type="search">` (query not wired yet). `cream-2` field, `field` border, radius `11px`, search icon + placeholder + `focus-within:border-navy`/`bg-cream-3`; `⌘K` `kbd` hint shown `≥lg`. Hidden `<640px`. |
| Date + wings | `portal-topbar` (inline) | Right-aligned static "Saturday, 11 July" + "Kōwhai · Rātā · Tōtara". |
| View website | `portal-topbar` (inline) | Outline button (`navy` text, `#C9BCA0` border) → `/`. |
| Sign out | `portal-topbar` (inline) | Outline button with `logout` icon → `supabase.auth.signOut()` then `/login`. Icon-only `<860px`. |

`*` Rooms + the whole Administration group are admin-only. The Admin/Staff **role toggle** and the **building switch** were removed from the topbar and the mobile "More" sheet.

## Sub-components

- **`portal-sidebar`** (`components/portal/portal-sidebar.tsx`) — client island. Renders logo, nav list, admin group, and identity footer. Reads `usePortalRole()` for role (gates admin items + picks `me*`/`consoleName`) and `usePathname()` for the active item. Keep the whole sidebar client because both role and pathname are client concerns; nav data (labels/icons/hrefs) is a static array so this file stays small.
- **`portal-topbar`** (`components/portal/portal-topbar.tsx`) — **client** island (uses `useRouter` for sign-out). Hosts the search input, static date/wings, "View website" link, and the sign-out button. `role-toggle.tsx` and `building-switch.tsx` were **deleted**.
- **`sidebar-nav-item`** (`components/portal/sidebar-nav-item.tsx`) — presentational `<Link>` taking `{ href, label, icon, active }`. Active = `gold-deep` (`#D99A3C`) pill with `navy-deep` (`#232A4C`) text weight 600; inactive = transparent with `#B9BFD4` text weight 500 (source `1064–1076`). Icon is a `19×19` inline SVG from the shared icon set.

## Role context (client)

- **`PortalRoleProvider`** + **`usePortalRole()`** live in `lib/role-context.tsx` (`"use client"`). Provider wraps the portal subtree inside `PortalLayout`; it is **not** global (marketing pages never mount it). Shape: `{ role: 'admin' | 'staff'; setRole(r) }`. `initialRole` is derived **server-side** in `PortalLayout` from the signed-in user's `app_users.role_id` via `toPortalRole` (`super_admin`/`admin` → `admin`, everyone else → `staff`); with the toggle removed `setRole` has no UI caller. Before the schema is applied the lookup fails open and the default `admin` stands.
- Access helpers: `lib/supabase/current-user.ts` — `getCurrentUser()` (auth user + `app_users` row, fails open if the table/infra is missing), `canAccessPortal()`, `toPortalRole()`. Consumers: `portal-sidebar` (nav gating + identity), `mobile-tabbar`, and portal views that branch on role (Dashboard variant, Stock, Meal report).

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

- **Server (default):** `PortalLayout` frame, `<main>` wrapper, and each route's `loading.tsx` skeleton fallback.
- **Client islands:** `PortalRoleProvider` (holds state), `portal-topbar` (search input + sign-out via `useRouter`/browser Supabase client), `portal-sidebar` (active-nav via `usePathname` + role gating), `mobile-tabbar`. No page is marked client wholesale.

## Interactions

- **Logo / "View website"** → navigate to `/`.
- **Nav items** → their portal routes (`/portal`, `/portal/rooms`, `/portal/residents`, …); active item resolved from `usePathname()`.
- **Search box** → focusable input; typing does nothing yet (query/results not wired).
- **Sign out** → `supabase.auth.signOut()` → `router.replace('/login')` + `router.refresh()`.

## Loading skeletons
Every `/portal/**` segment has a `loading.tsx` rendered as the Suspense fallback during navigation/data load (auto-shows once pages fetch from Supabase). Shared toolkit: `components/portal/skeletons/portal-skeletons.tsx` (`SkeletonBlock` + `PortalPageSkeleton` with `grid` / `table` / `detail` variants); the dashboard route reuses `dashboard-skeleton.tsx`. Same visual language as the dashboard skeleton (`animate-pulse rounded-[14px] bg-line/70`), `aria-busy`/`aria-live` set.

## Tokens
`navy-deep` (sidebar bg), `gold-deep` (active nav pill), `bronze`/gold tile (logo mark), `cream`/`.9` + `blur(8px)` (sticky topbar), `cream-2` + `field` (search + role-on button), `border`/`E7DECD` (topbar divider), avatar-palette entries for `meColor`, `muted`/`muted-2` for eyebrow + meta. Radius: nav/inputs `11px`, pills `100px`, logo tile `10px`. Icons: `19×19`, `stroke-width 1.8`, `currentColor` (source `1060–1062`).

## Responsive (mobile)

Design source: `.design-src/victoria-mt-eden.dc.html` (canvas: `Victoria - Mobile.dc.html`, every screen at 390px). Breakpoints follow the design: **≤1024px** two-column splits collapse to one; **≤860px** the sidebar is replaced by a bottom tab bar; **≤680px** card grids go single-column and section padding trims.

| Width | Sidebar | Nav affordance | Topbar |
|---|---|---|---|
| ≥1024px | full `w-64` | left sidebar | full (search, date/wings, View website) |
| 861–1023px | slim icon rail (`w-[68px]`, forced) | left sidebar | full |
| ≤860px | **hidden** (`max-[860px]:hidden`) | **`mobile-tabbar`** (bottom) + More sheet | compact; date + "View website" hidden; sign-out shows icon-only |

- **`mobile-tabbar`** (`components/portal/mobile-tabbar.tsx`) — client island, `fixed bottom-0`, shown only `max-[860px]:flex`. Four primary destinations (Dashboard, Residents, Roster, Meals) with short labels + a **More** button. Active tab uses `gold-deep`. `<main>` gets `pb-[84px]` on mobile so content clears the bar; the bar respects `env(safe-area-inset-bottom)`.
- **More sheet** (inside `mobile-tabbar`) — bottom sheet holding identity, the full main nav, the admin group (admin only), and "View website". Backdrop tap or the close button dismisses it. This is the mobile home for everything dropped from the sidebar/topbar. (The role toggle previously here was removed.)
- **`.wide-scroll`** (`globals.css`) — opt-in wrapper (`overflow-x:auto`) for wide tables/grids (roster, stock) so they scroll horizontally instead of overflowing on phones; content sets its own `min-width`.

## Out of scope (this phase)
- Search box — focusable input but query/results not wired.
- Nav gating is still the coarse `admin`/`staff` split (mapped from `app_users.role_id`), not yet the fine-grained `role_permissions` matrix. No manual toggle. Admin-only routes visited as non-admin show an "Admin only" empty state, not a redirect.
- Access gating (unprovisioned → "access not provisioned" screen) is **live in code but fails open until the schema is applied**, so it only enforces once `app_users` exists in the DB.
- Date/wings are static strings (no "today" computation).

## Definition of Done
- Sidebar fixed + independently scrollable; topbar sticky with `blur` over `cream/.9`; `<main>` scrolls without body horizontal scroll.
- `/portal/**` requires a Supabase session (middleware redirects to `/login`); sign-out clears the session and returns to `/login`.
- Once the schema is applied, a signed-in user with no active `app_users` row sees the "access not provisioned" screen instead of the portal; the portal role reflects their `app_users.role_id`.
- Every portal route has a `loading.tsx` skeleton fallback.
- Active nav item shows the `gold-deep` pill matching the current route via `usePathname`.
- Role read only through `usePortalRole()`; identity/nav data from accessors, no inline fixtures, no raw hex in JSX.
- RSC/client boundary as specified; `pnpm build` + `pnpm lint` clean.
