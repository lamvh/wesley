# Design sync + Website CMS — plan & checklist

Tracks the Claude Design → code sync for the Victoria at Mt Eden project and the remaining Website CMS build. Status ticks reflect work up to 2026-07-18.

- **Design source (authoritative):** [`.design-src/Victoria-at-Mt-Eden-2026-07-18.dc.html`](../../.design-src/Victoria-at-Mt-Eden-2026-07-18.dc.html) (v1.2 / 18 Jul, 5142 lines)
- **Design board refs:** Landing → `Victoria - Landing.dc.html`; Admin → `Victoria - Admin Dashboard.dc.html` (Claude Design project `Wesley MtEden`, id `2e217115-028e-4d74-a00f-4f327c40c8df`)
- **Change-tracking log:** [landing-audit-log.md](../../docs/features/marketing/landing-audit-log.md) · [screen-registry.md](../../docs/screen-registry.md)
- **Re-audit:** `./scripts/landing-audit.sh`

## Phases

| # | Phase | Status | Detail |
|---|-------|--------|--------|
| 1 | Landing pages re-port (v1.0/v1.1) | ✅ done | [landing-audit-log.md](../../docs/features/marketing/landing-audit-log.md) |
| 2 | Resident screens v1.2 | ✅ done | [residents.md](../../docs/features/portal/residents.md) |
| 3 | Roster per-day on-call | ✅ done | this file → below |
| 4 | Website CMS (Supabase site_content) | ✅ done | [phase-04-website-cms.md](./phase-04-website-cms.md) |
| 5 | Follow-ups (reported-only) | ⏳ backlog | this file → below |

## Checklist

### ✅ Phase 1 — Landing re-port
- [x] Header/footer → single "Portal" button
- [x] Footer "Our rooms" column removed (3-col)
- [x] Our home "three room styles"; Home "Room 12" + testimonial author
- [x] Baseline + design-drift tracking in landing-audit-log.md (rev 5)

### ✅ Phase 2 — Resident screens (design v1.2)
- [x] Care-tier badge removed (card + profile header)
- [x] Detail name repositioned onto the card (banner 84px)
- [x] Card subtitle → "Room {room}"

### ✅ Phase 3 — Roster per-day on-call
- [x] Grid "On call · Nurse/HCA" row, per-day `<select>` (nurses→HCAs order)
- [x] `onCallByDay` state in roster-view; wired to grid + duty export
- [x] `buildDutySheets` uses per-day on-call (fallback to form value)
- [ ] **Follow-up:** persist on-call per day to Supabase (currently local state) — mirror the grid auto-save pattern

### ✅ Phase 4 — Website CMS  → [phase-04-website-cms.md](./phase-04-website-cms.md)
- [x] Migration `site_content` (jsonb) + RLS — `supabase/migrations/0013_site_content.sql`
- [x] `site-content-defaults.ts` + `getSiteContent()` deep-merge (`lib/data/site-content.ts`)
- [x] `saveSiteContent` / `resetSiteContent` actions (dotted-path upsert)
- [x] `/portal/website` editor (menu + fields + auto-save + reset + preview) + config
- [x] Nav entry "Website" + `website` icon
- [x] Rewired 6 marketing pages + components to `getSiteContent()` (async pages; icons/slots zipped by index; `footer.blurb` via `layout.tsx`); `marketing-content.ts` trimmed to job roles only. tsc + lint clean.
- [ ] **Follow-up:** run `0013_site_content.sql` on the DB; admin-gate the write action server-side (RLS is currently authenticated-write, matching the MVP pattern).

### ⏳ Phase 5 — Backlog (reported-only, decisions pending)
Resident CRUD parity items from [residents.md](../../docs/features/portal/residents.md#design-parity--open-items):
- [ ] #1 Room = free-text → `<select>` of real rooms
- [ ] #2 Resident detail room card + link to room
- [ ] #3/#4 Wing / Care-type model vs design (deliberate code extension — confirm keep)
- [ ] #5 Tier label "Normal" vs design "Standard"

## Notes
- Verified already-built (no work needed): Staff Team search+pagination + Wing column removed; Staff Roles & groups; Rates (inside Payroll tab); Payroll.
- Design files older than the 18 Jul copy are kept for provenance; `victoria-at-mt-eden.dc.html` (14 Jul) is **truncated at 256 KB** — do not diff against it.
