# Landing pages — audit & change-tracking log

Baseline snapshot of every **marketing (landing) route** so future changes are easy to track. Each row's `Checksum` is a stable content hash over the files that shape that route's rendered output — its page, the marketing components it renders, the marketing data (`marketing-content.ts`), the photo slot map (`photos.ts`), and the shared render helpers it touches (`photo.tsx` / `icons.tsx` / form primitives). If a checksum changes on the next audit, that route's output changed.

**Scope is marketing-only on purpose.** The checksum does **not** follow the `@/lib/mock-data` barrel (`index.ts`) — that re-exports every portal/roster fixture, and a roster data edit must not look like a landing change. Type-only / utility deps (`domain.ts`, `utils.ts`) are watched by last-commit under [Shared deps](#shared-deps-watch), not folded into the checksum.

**Re-run the audit:** `./scripts/landing-audit.sh` → compare `Checksum` / `Last commit` against the baseline below. Any diff → re-check that page and append a line to the [Audit log](#audit-log), then refresh the baseline. The script discovers files from a curated marketing-only list; when a route starts rendering a new component/data file, add it there.

Related: [screen-registry](../../screen-registry.md) (Claude Design provenance) · per-screen feature docs linked in the table.

## Routes

All landing routes live under `src/app/(marketing)/`, wrapped by `layout.tsx` (announcement bar + nav + footer). Public access, RSC with small client islands (forms).

## Baseline — audited 2026-07-17 (rev 3)

Status legend: ✅ verified (typecheck clean, all imports resolve, renders in source order). Header / Footer / Layout shell are the shared chrome wrapping every page route — tracked as separate rows so a nav edit is distinguishable from a footer edit.

| Screen | Route | Checksum | Files | Lines | Last commit | Status | Doc |
|--------|-------|----------|-------|-------|-------------|--------|-----|
| Home | `/` | `30f2d90870ad` | 12 | 682 | 2026-07-14 `fb1266a` | ✅ | [home](./home.md) |
| Our rooms | `/our-rooms` | `52c1c9fdddb8` | 6 | 316 | 2026-07-13 `4096edc` | ✅ | [our-rooms](./our-rooms.md) |
| Life here | `/life-here` | `6db2163a7d59` | 9 | 420 | 2026-07-14 `fb1266a` | ✅ | [life-here](./life-here.md) |
| Our home | `/our-home` | `a92ef3f36194` | 9 | 406 | 2026-07-13 `4096edc` | ✅ | [our-home](./our-home.md) |
| Careers | `/careers` | `b13efe7b3a53` | 6 | 297 | 2026-07-13 `4096edc` | ✅ | [careers](./careers.md) |
| Contact | `/contact` | `c5553d9b02a2` | 11 | 711 | 2026-07-13 `4096edc` | ✅ | [contact](./contact.md) |
| Header | `(all)` | `c6aacc26f812` | 3 | 177 | 2026-07-14 `fb1266a` | ✅ | — |
| Footer | `(all)` | `bf337dc78acb` | 1 | 68 | 2026-07-13 `1668517` | ✅ | — |
| Layout shell | `(all)` | `ca65478250aa` | 1 | 18 | 2026-07-13 `1668517` | ✅ | — |

`Files` = files counted in the checksum. `Lines` = combined line count. `Last commit` = most recent commit touching any file in that set.

> **Note on the 14 Jul dates.** Home / Life here / Header show `fb1266a` (14 Jul) only because they include `icons.tsx`, which that commit **appended** portal/stock icons to (`staff`, `edit`, `trash`…). No marketing icon was modified, so the rendered pages are unchanged — the date reflects the shared icon file, not the page. The actual marketing content (`marketing-content.ts`) and every marketing component are unchanged since 13 Jul (`4096edc`/`1668517`).

### Files per route (checksum inputs)

Every **page** route also includes shared data `marketing-content.ts` + `photos.ts`.

- **Home** — `page.tsx` + `home/{hero, welcome-section, care-levels-section, family-teaser, testimonial, enquiry-cta}.tsx` + `feature-grid.tsx` + `shared/{photo, icons}.tsx`
- **Our rooms** — `our-rooms/page.tsx` + `room-style-row.tsx` + `shared/{marketing-page-header, photo}.tsx`
- **Life here** — `life-here/page.tsx` + `{feature-grid, day-timeline, photo-mosaic}.tsx` + `shared/{marketing-page-header, photo, icons}.tsx`
- **Our home** — `our-home/page.tsx` + `our-home/{photo-copy-split, facility-card, wing-card, find-us-panel}.tsx` + `shared/{marketing-page-header, photo}.tsx`
- **Careers** — `careers/page.tsx` + `careers/{benefit-card, role-row}.tsx` + `shared/marketing-page-header.tsx`
- **Contact** — `contact/page.tsx` + `contact/{contact-details, request-visit-form}.tsx` + `shared/{marketing-page-header, photo}.tsx` + `ui/{button, input, select, textarea}.tsx`
- **Header** — `announcement-bar.tsx` + `site-nav.tsx` + `shared/icons.tsx` (nav uses `cn` from `utils.ts` — see Shared deps)
- **Footer** — `site-footer.tsx` (self-contained: hardcoded columns, access links, copyright — no data import)
- **Layout shell** — `layout.tsx` (wrapper that assembles Header + `<main>` + Footer)

### Shared deps watch

Not in any checksum (type-only / utilities — changes here rarely alter rendered output and are caught by `tsc`). Re-check the pages manually only if these change in a marketing-relevant way.

| File | Last commit | Notes |
|------|-------------|-------|
| `types/domain.ts` | 2026-07-15 `3eeb24d` | Roster types added; no marketing type touched. |
| `lib/utils.ts` | 2026-07-13 `1668517` | `cn()` helper; unchanged. |

## Audit log

Newest first. One line per audit: `<date> — <screen(s)> — <what changed / "no change">`.

- **2026-07-17 (rev 3)** — chrome — split the single `Layout (chrome)` row into **Header** (`announcement-bar` + `site-nav` + `icons`), **Footer** (`site-footer`), and **Layout shell** (`layout.tsx`), matching the design's component split so a nav edit is distinguishable from a footer edit. Verified header + footer are self-contained (footer hardcodes its links/copyright, no data import; nav's only extra dep is `cn` from `utils.ts`, in Shared deps). No output change vs rev 2.
- **2026-07-17 (rev 2)** — all 7 routes — **corrected baseline**. The rev-1 checksums were computed over an incomplete file set (missed `marketing-content.ts`, `photos.ts`, `icons.tsx`, form primitives) and reported inaccurate last-commit dates; superseded — do not compare against rev-1 hashes. New checksums cover the full marketing-only render surface. Verified: rendered landing output unchanged since 13 Jul; the 14 Jul dates are shared `icons.tsx` appends only (no marketing icon changed).
- **2026-07-17 (rev 1)** — all 7 routes — initial baseline (superseded by rev 2; file set incomplete).
