# Screen Registry — code · version · changelog

Single source of truth for **which Claude Design screen** each route was ported from, at **which version**. Review changes here — no tracing component by component.

**Rules:** [00-rules §12](./00-rules-and-conventions.md#12-screen-code--version-claude-design-provenance). `Code` and `Version` are **supplied by Claude Design** — copy verbatim, never invent. On every re-pull from Claude Design: bump the version here + in the feature-doc header, and append a Changelog line. `—` = not yet recorded (fill from Claude Design).

## Marketing

| Code | Screen | Route | Version | Doc |
|------|--------|-------|---------|-----|
| — | Home | `/` | — | [home](./features/marketing/home.md) |
| — | Our rooms | `/our-rooms` | — | [our-rooms](./features/marketing/our-rooms.md) |
| — | Life here | `/life-here` | — | [life-here](./features/marketing/life-here.md) |
| — | Our home | `/our-home` | — | [our-home](./features/marketing/our-home.md) |
| — | Careers | `/careers` | — | [careers](./features/marketing/careers.md) |
| — | Contact | `/contact` | — | [contact](./features/marketing/contact.md) |

## Portal

| Code | Screen | Route | Version | Doc |
|------|--------|-------|---------|-----|
| — | Login | `/login` | — | [login](./features/portal/login.md) |
| — | Dashboard | `/portal` | — | [dashboard](./features/portal/dashboard.md) |
| — | Buildings | `/portal/buildings` | — | [buildings](./features/portal/buildings.md) |
| — | Rooms | `/portal/rooms` | — | [rooms](./features/portal/rooms.md) |
| — | Room detail | `/portal/rooms/[num]` | — | [room-detail](./features/portal/room-detail.md) |
| — | Residents | `/portal/residents` | — | [residents](./features/portal/residents.md) |
| — | Resident detail | `/portal/residents/[id]` | — | [resident-detail](./features/portal/resident-detail.md) |
| — | Roster & shifts | `/portal/roster` | — | [roster-shifts](./features/portal/roster-shifts.md) |
| — | Meals & dietary | `/portal/meals` | — | [meals-dietary](./features/portal/meals-dietary.md) |
| — | Meal report | `/portal/meal-report` | — | [meal-report](./features/portal/meal-report.md) |
| — | Activities | `/portal/activities` | — | [activities](./features/portal/activities.md) |
| — | Family portal | `/portal/family` | — | [family-portal](./features/portal/family-portal.md) |
| — | Stock & supplies | `/portal/stock` | — | [stock-supplies](./features/portal/stock-supplies.md) |
| — | Incidents & compliance | `/portal/incidents` | — | [incidents-compliance](./features/portal/incidents-compliance.md) |
| — | Staff (Administration) | `/portal/staff` | — | [staff](./features/portal/staff.md) |
| — | Users & access | `/portal/users` | — | [users-access](./features/portal/users-access.md) |

## Changelog (per screen)

Newest first. One line per re-pull from Claude Design: `<code> <version> — <what changed>`.

<!-- e.g. P1 v3 — added building-specific columns to duty roster -->
