# 02 · Architecture

## Route map

### Marketing — `(marketing)` group, shared `MarketingLayout` (announcement + sticky nav + footer)

| URL | File | Screen |
|-----|------|--------|
| `/` | `app/(marketing)/page.tsx` | Home |
| `/our-rooms` | `app/(marketing)/our-rooms/page.tsx` | Our rooms |
| `/life-here` | `app/(marketing)/life-here/page.tsx` | Life here |
| `/our-home` | `app/(marketing)/our-home/page.tsx` | Our home |
| `/careers` | `app/(marketing)/careers/page.tsx` | Careers |
| `/contact` | `app/(marketing)/contact/page.tsx` | Contact |

### Portal — `/portal`, shared `PortalLayout` (sidebar + topbar + role toggle)

| URL | File | Screen | Access |
|-----|------|--------|--------|
| `/portal` | `app/portal/page.tsx` | Dashboard (admin+staff variants) | both |
| `/portal/rooms` | `app/portal/rooms/page.tsx` | Rooms | admin |
| `/portal/rooms/[num]` | `app/portal/rooms/[num]/page.tsx` | Room detail | admin |
| `/portal/residents` | `app/portal/residents/page.tsx` | Residents | both |
| `/portal/residents/[id]` | `app/portal/residents/[id]/page.tsx` | Resident detail | both |
| `/portal/roster` | `app/portal/roster/page.tsx` | Roster & shifts | both |
| `/portal/meals` | `app/portal/meals/page.tsx` | Meals & dietary | both |
| `/portal/activities` | `app/portal/activities/page.tsx` | Activities | both |
| `/portal/family` | `app/portal/family/page.tsx` | Family portal | both |
| `/portal/stock` | `app/portal/stock/page.tsx` | Stock & supplies | all staff |
| `/portal/meal-report` | `app/portal/meal-report/page.tsx` | Meal report (intake logging) | all staff |
| `/portal/buildings` | `app/portal/buildings/page.tsx` | Buildings (multi-site) | admin |
| `/portal/incidents` | `app/portal/incidents/page.tsx` | Incidents & compliance | admin |
| `/portal/users` | `app/portal/users/page.tsx` | Users & access (RBAC, super-admin) | admin |

`[num]` = room number (`05`). `[id]` = resident slug (`margaret-whitcombe`). Detail screens are real routes (source uses modal state; we use nested routes + a back link).

## Folder structure

```
src/
├── app/
│   ├── layout.tsx                 # root: fonts, providers, <html>
│   ├── globals.css                # tokens (@theme), base
│   ├── (marketing)/
│   │   ├── layout.tsx             # MarketingLayout
│   │   └── <pages>
│   └── portal/
│       ├── layout.tsx             # PortalLayout (+ PortalRoleProvider)
│       └── <pages>
├── components/
│   ├── ui/                        # shadcn generated
│   ├── shared/                    # icons, Photo, badges, kpi-card
│   ├── marketing/                 # nav, footer, hero, room-card, feature-grid, day-timeline, enquiry-form...
│   └── portal/                    # sidebar, topbar, role-toggle, occupancy-bar, room-card, resident-card,
│                                  #   shift-column, meal-card, activity-week, stock-table, incident-table, family-feed...
├── lib/
│   ├── mock-data/                 # one file per entity + index accessors
│   ├── role-context.tsx           # PortalRoleProvider + usePortalRole (client)
│   └── utils.ts                   # cn(), slugify(), care-tier helpers
└── types/
    └── domain.ts                  # entity interfaces
```

## RSC / client boundary

Default = Server Component. Client islands (smallest possible):

| Island | Why client |
|--------|-----------|
| `PortalRoleProvider` / `role-toggle` | holds admin/staff state, toggled in topbar |
| `portal/sidebar` nav active state | reads pathname (`usePathname`) for active item |
| `marketing/nav` active state | reads pathname |
| filter pills (residents tier, roster week view) | local UI state (visual only this phase) |
| form fields (contact, enquiry) | controlled inputs (inert submit this phase) |

Pages, layouts, cards, lists, tables = RSC reading mock-data accessors.

## Role model

- `PortalRoleProvider` (client) wraps portal layout; `usePortalRole()` → `{ role, setRole }`. Default `admin`. Not persisted this phase.
- **Nav structure** (`lib/portal-nav.ts`): main = Dashboard · Stock · Meal report · Rooms(admin) · Residents · Roster · Meals · Activities · Family; Administration group (admin) = Buildings · Incidents · Users & access. Sidebar is collapsible (client `useState`).
- **Admin-only nav** (Rooms, Buildings, Incidents, Users & access) hidden when `role === 'staff'`. Stock & Meal report are visible to all staff.
- **Active building** (`BuildingProvider` / `useBuilding`, client): topbar `BuildingSwitch` (admin) selects the care home; shared with the Buildings screen + Stock header. Visual scoping this phase; becomes a real per-building data filter + RLS dimension with the DB.
- **Permission model** (Users & access): a `role → module → action` matrix (`PermissionMatrix`, see 03-data-model.md). UI-editable this phase; becomes the server-side authorization source (RLS) with real auth.
- **Dashboard** renders admin vs staff variant (greeting, KPIs, alerts differ — lines 1124–1148).
- Topbar shows role pill toggle + identity: admin = Sarah Beckett / Facility Manager / SB / `#BE7350`; staff = Aroha Ngata / Registered Nurse · Rātā / AN / `#6E875E` (lines 1408–1411). Console name: admin "Admin Console", staff "Care Station".
- Admin-only screens: if visited as staff, show a simple "Admin only" empty state (no hard guard/redirect this phase).

## Navigation behaviour

- Marketing↔portal: "Staff portal" / "Family login" buttons → `/portal` and `/portal/family`; portal "View website" / logo → `/`.
- Portal sidebar items → portal routes; active item styled with `gold-deep` pill (lines 1064–1076).
- Detail open = navigate to nested route; "‹ All rooms / All residents" back link → list route.

## Image strategy

- Download ~30 uploaded photos from the design project into `public/images/`.
- `<Photo slot="vme-hero" alt="..." />` (`components/shared/photo.tsx`) maps slot ID → file via `next/image`; unmapped slot → labelled placeholder (design uses `image-slot` with a placeholder string; keep that string as fallback label).
- Slot→file mapping lives in `lib/mock-data/photos.ts` (built by cross-referencing `screenshots/*.png` in the design project). Activities screen uses direct `assets/act-*.jpeg` / `assets/birthday-*.jpeg` (lines 951–1000) — copy those too.

## Responsive / mobile

The design is one responsive layout (desktop-first) that reflows at phone width (390px reference). Implemented with Tailwind `max-*` utilities mapping to the design's own breakpoints (~1024 / ~860 / ~680px → `lg` / `md` / `sm`):

- **Marketing nav** (`site-nav`): below `lg` the desktop nav is replaced by a hamburger → dropdown drawer (client `useState`); "Family login" hidden below `sm`; hero H1 shrinks 62→44→40px, hero height becomes auto.
- **Portal sidebar** (`portal-sidebar`): below 1024px auto-collapses to a slim **icon rail** (68px, still visible + navigable) via `useMediaQuery`; the expand/collapse toggle only shows on desktop.
- **Topbar**: wraps on mobile; building switch + date hidden below `md`; search hidden below `sm`.
- **Grids** stack (`max-md:grid-cols-1`, KPI rows `grid-cols-4 max-md:grid-cols-2`).
- **Wide tables** (roster grid, meal-report, users, incidents, permission matrix) live in an `overflow-x-auto` wrapper with a `min-w-[…]` inner so they scroll internally — the page body never scrolls horizontally.

The "Victoria - Mobile" design file is a canvas board rendering these same screens at 390px — no separate mobile screens.

## Providers (root layout)

Fonts (Newsreader + Instrument Sans via `next/font`), `PortalRoleProvider` scoped to portal layout only (not global). No theme/dark-mode provider this phase (single light theme).
