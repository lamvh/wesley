# Landing pages - audit & change-tracking log

Baseline snapshot of every **marketing (landing) route** so future changes are easy to track. Each row's `Checksum` is a stable content hash over the files that shape that route's rendered output - its page, the marketing components it renders, the marketing data (`marketing-content.ts`), the photo slot map (`photos.ts`), and the shared render helpers it touches (`photo.tsx` / `icons.tsx` / form primitives). If a checksum changes on the next audit, that route's output changed.

**Scope is marketing-only on purpose.** The checksum does **not** follow the `@/lib/mock-data` barrel (`index.ts`) - that re-exports every portal/roster fixture, and a roster data edit must not look like a landing change. Type-only / utility deps (`domain.ts`, `utils.ts`) are watched by last-commit under [Shared deps](#shared-deps-watch), not folded into the checksum.

**Re-run the audit:** `./scripts/landing-audit.sh` → compare `Checksum` / `Last commit` against the baseline below. Any diff → re-check that page and append a line to the [Audit log](#audit-log), then refresh the baseline. The script discovers files from a curated marketing-only list; when a route starts rendering a new component/data file, add it there.

Related: [screen-registry](../../screen-registry.md) (Claude Design provenance) · per-screen feature docs linked in the table.

## Routes

All landing routes live under `src/app/(marketing)/`, wrapped by `layout.tsx` (announcement bar + nav + footer). Public access, RSC with small client islands (forms).

## Baseline - audited 2026-07-17 (rev 5)

Status legend: ✅ verified (typecheck + lint clean, all imports resolve, renders in source order). Header / Footer / Layout shell are the shared chrome wrapping every page route - tracked as separate rows so a nav edit is distinguishable from a footer edit. Rev 5 re-ports the landing pages to design v1.0 (16 Jul).

| Screen | Route | Checksum | Files | Lines | Last commit | Status | Doc |
|--------|-------|----------|-------|-------|-------------|--------|-----|
| Home | `/` | `cec7c3c7c97c` | 12 | 682 | 2026-07-17 `faab225` | ✅ | [home](./home.md) |
| Our rooms | `/our-rooms` | `770d2430aba0` | 6 | 316 | 2026-07-17 `faab225` | ✅ | [our-rooms](./our-rooms.md) |
| Life here | `/life-here` | `6b13b29079d3` | 9 | 420 | 2026-07-17 `faab225` | ✅ | [life-here](./life-here.md) |
| Our home | `/our-home` | `4a1a1431ff89` | 9 | 406 | 2026-07-17 `faab225` | ✅ | [our-home](./our-home.md) |
| Careers | `/careers` | `60fff2db55f3` | 6 | 297 | 2026-07-17 `faab225` | ✅ | [careers](./careers.md) |
| Contact | `/contact` | `7419927d89e4` | 11 | 711 | 2026-07-17 `faab225` | ✅ | [contact](./contact.md) |
| Header | `(all)` | `a7dad2a72133` | 3 | 171 | 2026-07-17 `faab225` | ✅ | - |
| Footer | `(all)` | `7a2f596f01ab` | 1 | 61 | 2026-07-17 `faab225` | ✅ | - |
| Layout shell | `(all)` | `ca65478250aa` | 1 | 18 | 2026-07-13 `1668517` | ✅ | - |

`Files` = files counted in the checksum. `Lines` = combined line count. `Last commit` = most recent commit touching any file in that set.

> **Note on the 14 Jul dates.** Home / Life here / Header show `fb1266a` (14 Jul) only because they include `icons.tsx`, which that commit **appended** portal/stock icons to (`staff`, `edit`, `trash`…). No marketing icon was modified, so the rendered pages are unchanged - the date reflects the shared icon file, not the page. The actual marketing content (`marketing-content.ts`) and every marketing component are unchanged since 13 Jul (`4096edc`/`1668517`).

### Files per route (checksum inputs)

Every **page** route also includes shared data `marketing-content.ts` + `photos.ts`.

- **Home** - `page.tsx` + `home/{hero, welcome-section, care-levels-section, family-teaser, testimonial, enquiry-cta}.tsx` + `feature-grid.tsx` + `shared/{photo, icons}.tsx`
- **Our rooms** - `our-rooms/page.tsx` + `room-style-row.tsx` + `shared/{marketing-page-header, photo}.tsx`
- **Life here** - `life-here/page.tsx` + `{feature-grid, day-timeline, photo-mosaic}.tsx` + `shared/{marketing-page-header, photo, icons}.tsx`
- **Our home** - `our-home/page.tsx` + `our-home/{photo-copy-split, facility-card, wing-card, find-us-panel}.tsx` + `shared/{marketing-page-header, photo}.tsx`
- **Careers** - `careers/page.tsx` + `careers/{benefit-card, role-row}.tsx` + `shared/marketing-page-header.tsx`
- **Contact** - `contact/page.tsx` + `contact/{contact-details, request-visit-form}.tsx` + `shared/{marketing-page-header, photo}.tsx` + `ui/{button, input, select, textarea}.tsx`
- **Header** - `announcement-bar.tsx` + `site-nav.tsx` + `shared/icons.tsx` (nav uses `cn` from `utils.ts` - see Shared deps)
- **Footer** - `site-footer.tsx` (self-contained: hardcoded columns, access links, copyright - no data import)
- **Layout shell** - `layout.tsx` (wrapper that assembles Header + `<main>` + Footer)

### Shared deps watch

Not in any checksum (type-only / utilities - changes here rarely alter rendered output and are caught by `tsc`). Re-check the pages manually only if these change in a marketing-relevant way.

| File | Last commit | Notes |
|------|-------------|-------|
| `types/domain.ts` | 2026-07-15 `3eeb24d` | Roster types added; no marketing type touched. |
| `lib/utils.ts` | 2026-07-13 `1668517` | `cn()` helper; unchanged. |

## Design source & drift

Code is ported **from** the Claude Design HTML in `.design-src/`. Code checksums (above) only catch code-vs-code change - this section tracks the design side so **design→code drift** (design edited, code not yet ported) is visible.

Design files - baseline 2026-07-17. The authoritative source is now the **full** landing design pulled from Claude Design (project `Wesley MtEden`, file `Victoria - Landing.dc.html` → screens in `Victoria at Mt Eden.dc.html`), v1.0 / 16 Jul.

| Design file | Checksum | Modified | Authoritative |
|-------------|----------|----------|---------------|
| `Victoria-at-Mt-Eden-2026-07-16.dc.html` | `66c8a33d3728` | 2026-07-16 (v1.0) | ✅ newest - port from this |
| `victoria-at-mt-eden.dc.html` | `614ae17572f2` | 2026-07-14 14:06 | superseded (⚠ truncated at 256 KB) |
| `victoria-mt-eden.dc.html` | `45458c6845bd` | 2026-07-14 02:15 | - |
| `victoria-all-screens-v3.html` | `74314fa59ead` | 2026-07-13 22:24 | - |
| `victoria-all-screens-v2.html` | `4b0329ba700c` | 2026-07-13 21:34 | - |
| `victoria-all-screens.html` | `e60116a687c8` | 2026-07-13 20:11 | - |

> **Correction to rev 4.** Rev 4 claimed the footer "Our rooms" column was *not* removed. That was wrong: it compared against `victoria-at-mt-eden.dc.html`, which is **truncated at exactly 256 KB** (an old read-cap artifact — its footer still showed the old 4 columns). The complete 16 Jul design (464 KB) **does remove** the footer "Our rooms" column. Ported in rev 5. Always diff against the full `Victoria-at-Mt-Eden-2026-07-16.dc.html`, not the truncated file.

### Drift status - all RESOLVED in rev 5 (ported to design v1.0)

- ✅ **Header** - two login buttons collapsed to a single **"Portal"** button (`/login`). `site-nav.tsx`.
- ✅ **Footer Access** - "Family login" + "Staff portal" → single **"Portal login"** (`/login`). `site-footer.tsx`.
- ✅ **Footer "Our rooms" column removed** - footer now 3 columns (Brand + "Our home" + "Access"), grid `1.6fr 1fr 1fr`. `site-footer.tsx`.
- ✅ **Our home** - intro dropped "across three connected wings"; section heading "Our three wings" → **"Our three room styles"**; wing-card slot `wing-*` → `roomstyle-*`. `our-home/page.tsx`, `wing-card.tsx`, `photos.ts`.
- ✅ **Our home copy** - "Wings are short and easy to navigate" → **"Corridors are short…"**. `photo-copy-split.tsx`.
- ✅ **Home** - family-teaser sample card "Rātā 12" → **"Room 12"**; testimonial author dropped "Kōwhai" → "daughter of a resident". `family-teaser.tsx`, `marketing-content.ts`.

## Audit log

Newest first. One line per audit: `<date> - <screen(s)> - <what changed / "no change">`.

- **2026-07-17 (rev 5)** - all pages - **re-ported landing to design v1.0 (16 Jul)**, pulled full from Claude Design via MCP (`Victoria at Mt Eden.dc.html`, 464 KB — the local 14 Jul copy was truncated at 256 KB and misleading). Resolved all drift: header + footer-Access → "Portal"; **footer "Our rooms" column removed** (3-col); Our home "three wings" → "three room styles" + intro/copy edits; Home "Rātā 12" → "Room 12" + testimonial author. tsc + lint clean. See [Design source & drift](#design-source--drift) for the full list and the rev-4 correction.
- **2026-07-17 (rev 4)** - chrome - added **design-source drift tracking**. Compared code against the authoritative design (`victoria-at-mt-eden.dc.html`, 14 Jul): found 2 OPEN drifts - header and footer-Access login buttons collapsed to a single **"Portal"** in design, code still has separate "Family login" + "Staff portal". Recorded under [Design source & drift](#design-source--drift). Verified footer "Our rooms" was **not** removed (matches design). Code not changed this rev.
- **2026-07-17 (rev 3)** - chrome - split the single `Layout (chrome)` row into **Header** (`announcement-bar` + `site-nav` + `icons`), **Footer** (`site-footer`), and **Layout shell** (`layout.tsx`), matching the design's component split so a nav edit is distinguishable from a footer edit. Verified header + footer are self-contained (footer hardcodes its links/copyright, no data import; nav's only extra dep is `cn` from `utils.ts`, in Shared deps). No output change vs rev 2.
- **2026-07-17 (rev 2)** - all 7 routes - **corrected baseline**. The rev-1 checksums were computed over an incomplete file set (missed `marketing-content.ts`, `photos.ts`, `icons.tsx`, form primitives) and reported inaccurate last-commit dates; superseded - do not compare against rev-1 hashes. New checksums cover the full marketing-only render surface. Verified: rendered landing output unchanged since 13 Jul; the 14 Jul dates are shared `icons.tsx` appends only (no marketing icon changed).
- **2026-07-17 (rev 1)** - all 7 routes - initial baseline (superseded by rev 2; file set incomplete).
