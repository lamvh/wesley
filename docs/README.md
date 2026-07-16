# Wesley — Victoria at Mt Eden · Documentation

Frontend build of the **Victoria at Mt Eden** product for Wesley Home & Care — a boutique NZ aged-care home. Public marketing site + secure staff portal. Ported from the Claude Design source (`.design-src/victoria-all-screens.html`).

**This phase = all screens, static, mock data. Database/auth integrated later.**

## Reading order

| Doc | What it governs |
|-----|-----------------|
| [00-rules-and-conventions.md](./00-rules-and-conventions.md) | **Read first.** Governing rules for everything — naming, styling, data, docs, DoD. |
| [01-design-system.md](./01-design-system.md) | Tokens: palette, typography, spacing, status colors, icons, shadcn mapping. |
| [02-architecture.md](./02-architecture.md) | Routing map, folder structure, RSC/client boundaries, role model, image strategy. |
| [03-data-model.md](./03-data-model.md) | Entity interfaces, mock-data layer, future Supabase mapping. |
| [feature-doc-template.md](./feature-doc-template.md) | Template every feature/screen doc follows. |
| [screen-registry.md](./screen-registry.md) | Screen code + version (from Claude Design) per route + changelog — the one place to review what changed. |
| [implementation-guide.md](./implementation-guide.md) | Deferred-phase reference: Supabase/DB + auth setup (not built this phase). |

## Screen & component docs

**Shared layouts** — [marketing-layout](./components/marketing-layout.md) · [portal-shell](./components/portal-shell.md)

**Marketing** — [home](./features/marketing/home.md) · [our-rooms](./features/marketing/our-rooms.md) · [life-here](./features/marketing/life-here.md) · [our-home](./features/marketing/our-home.md) · [careers](./features/marketing/careers.md) · [contact](./features/marketing/contact.md)

**Portal** — [dashboard](./features/portal/dashboard.md) · [buildings](./features/portal/buildings.md) · [rooms](./features/portal/rooms.md) · [room-detail](./features/portal/room-detail.md) · [residents](./features/portal/residents.md) · [resident-detail](./features/portal/resident-detail.md) · [roster-shifts](./features/portal/roster-shifts.md) · [meals-dietary](./features/portal/meals-dietary.md) · [meal-report](./features/portal/meal-report.md) · [activities](./features/portal/activities.md) · [family-portal](./features/portal/family-portal.md) · [stock-supplies](./features/portal/stock-supplies.md) · [incidents-compliance](./features/portal/incidents-compliance.md) · [users-access](./features/portal/users-access.md)

## Product at a glance

- **Marketing site (6):** Home · Our rooms · Life here · Our home · Careers · Contact
- **Staff portal (15):** Dashboard (admin+staff) · Buildings (multi-site) · Rooms · Room detail · Residents · Resident detail · Roster & shifts (weekly scheduler) · Meals & dietary · Meal report · Activities · Family portal · Stock & supplies (inventory/order/providers) · Incidents & compliance · Users & access (RBAC)
- **Roles:** Admin (Sarah Beckett, Facility Manager) · Staff (Aroha Ngata, RN) — client-side toggle, no auth this phase.

## Rule (non-negotiable)

**No code before its doc.** Every screen, shared component, and non-trivial function is documented (per template) before or alongside implementation. See [00-rules-and-conventions.md](./00-rules-and-conventions.md).
