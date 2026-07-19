# Phase 4 — Website content CMS

Admin screen to edit the public marketing copy, persisted to Supabase, so edits update the live pages. Design: `Victoria at Mt Eden.dc.html` lines 2147–2198 (screen) + `siteContentDefaults()` ~3662–3732 (content schema).

- **Priority:** medium · **Status:** not started
- **Route:** `/portal/website` (admin only) · **Design ver:** v1.0 (17 Jul)

## Key insight
`siteContentDefaults` already contains ALL marketing copy — the same data as `src/lib/mock-data/marketing-content.ts` PLUS the page-header/section copy currently hardcoded across the marketing pages/components. The CMS is the single source; static content becomes the default layer.

## Approach (chosen: Supabase overrides + deep-merge)
`getSiteContent()` = deep-merge(defaults, DB override row). Marketing pages read `getSiteContent()` instead of static accessors. Editor writes overrides.

## Data model
- Migration `supabase/migrations/NNNNNN_site_content.up.sql`:
  - `site_content (id text primary key default 'site', content jsonb not null default '{}', updated_at timestamptz default now())`
  - RLS: `select` for anon+authenticated (public site reads it); `insert/update` for admin role only.
- Type `SiteContent` in `src/types/domain.ts` mirroring the defaults shape (hero, welcome, homeRooms, homeLife, family, testimonial, enquiry, care, life, ourhome, careers, contact, footer, careLevels[], features[], dayTimeline[], facilities[], careWings[], benefits[]).

## Files to create
- `src/lib/mock-data/site-content-defaults.ts` — port `siteContentDefaults` verbatim (em dashes → hyphens per project rule); re-export the arrays currently in `marketing-content.ts` so there is one source.
- `src/lib/data/site-content.ts` — `getSiteContent()` (server, reads row + deep-merge over defaults).
- `src/lib/actions/site-content.ts` — `saveSiteContent(path: string, value)` server action, dotted-path upsert into the jsonb; `resetSiteContent()`.
- `src/app/portal/website/page.tsx` — server page, loads content, renders editor.
- `src/components/portal/website/website-cms.tsx` — client editor: left sticky menu (Home, Our rooms, Life here, Our home, Careers, Contact, Footer), right field groups (input = single line, textarea = multiline), auto-save on blur/debounce, "Reset to defaults", "Preview page ↗" (opens `/`). Careers section shows the "roles managed on Recruitment" note.
- `src/components/portal/website/cms-field.tsx` — one label + input/textarea bound to a dotted path.

## Files to modify (rewire — the risky part; do last, verify each)
Read from `getSiteContent()` instead of static copy:
- Pages: `page.tsx`, `our-rooms/`, `life-here/`, `our-home/`, `careers/`, `contact/` under `src/app/(marketing)/`.
- Components with hardcoded copy: `home/{hero,welcome-section,care-levels-section,family-teaser,testimonial,enquiry-cta}`, `feature-grid`, `day-timeline`, `our-home/{photo-copy-split,facility-card,wing-card,find-us-panel}`, `careers/*`, `contact/contact-details`, `site-footer`, `shared/marketing-page-header` usages.
- `marketing-content.ts` accessors → delegate to defaults (or remove once callers use `getSiteContent()`).
- Nav: add "Website" entry (admin) in the portal sidebar + mobile tabs.

## Implementation steps
1. Migration + RLS; regenerate types if used.
2. `site-content-defaults.ts` (port + em-dash clean) + `SiteContent` type.
3. `getSiteContent()` deep-merge + `saveSiteContent`/`resetSiteContent` actions.
4. Editor route + components (menu/fields/auto-save/reset/preview) — screen parity with design 2147–2198.
5. Rewire marketing pages/components one at a time; after each, `tsc` + visual check the page still renders identically to the current baseline.
6. Nav entry + admin gating.

## Todo
- [ ] Migration `site_content` + RLS
- [ ] `SiteContent` type
- [ ] `site-content-defaults.ts` (em dashes → hyphens)
- [ ] `getSiteContent()` deep-merge
- [ ] `saveSiteContent` / `resetSiteContent` actions
- [ ] `/portal/website` editor route + components
- [ ] Nav entry "Website" (admin)
- [ ] Rewire 6 marketing pages + components → `getSiteContent()`
- [ ] Re-run `./scripts/landing-audit.sh`; update landing-audit-log + screen-registry (Website screen, ver)

## Success criteria
1. Editing a field in `/portal/website` and reloading `/` shows the change (persisted).
2. With no overrides, every marketing page renders byte-identical to today (defaults == current copy).
3. `tsc` + `pnpm lint` clean; RLS blocks non-admin writes.

## Risks
- Rewiring the 6 marketing pages can regress the copy just aligned in Phase 1 — mitigate by making defaults exactly equal current copy and diffing each page after rewire.
- Deep-merge of arrays (careLevels/features/…) — decide replace-whole-array vs per-item merge; simplest is whole-array override.

## Security
- Write actions admin-only (RLS + server-side role check). Public read is fine (marketing copy is public).
