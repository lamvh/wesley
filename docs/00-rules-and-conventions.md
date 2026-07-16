# 00 · Rules & Conventions (governing document)

**Authority:** This document overrides ad-hoc decisions. Every screen, component, function, commit, and doc follows it. If a rule blocks you, raise it — don't silently deviate.

Principles: **YAGNI · KISS · DRY.** Build only what the design shows. No speculative abstraction.

---

## 1. Documentation-first (the core rule)

- **No code before its doc.** Every screen, shared component, and non-trivial function has a doc (per [feature-doc-template.md](./feature-doc-template.md)) written **before or alongside** its implementation.
- Feature docs live in `docs/features/{marketing|portal}/<slug>.md`. Component docs in `docs/components/<slug>.md`.
- A screen is "documented" when its doc fills every template section — no `TBD`.
- When code and doc disagree, fix whichever is wrong in the **same** change. Docs are not allowed to rot.
- Source of truth for the design: `.design-src/victoria-all-screens.html` (readable). Cite it by line range in feature docs.

## 2. Scope this phase

**In:** all 18 screens, pixel-faithful, static, mock data, working client navigation, role toggle.
**Out (stub/omit, do NOT build):** Supabase/DB, auth/login, real form submission, search, write actions, pagination, i18n framework. Buttons that would mutate are present visually but inert (or `console`-noop). Note every such stub in the feature doc's "Out of scope" line.

## 3. Tech stack (locked)

Next.js (latest, App Router + RSC) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · `next/font` · pnpm. Supabase deferred. No other UI/state libraries without updating this doc first.

## 4. Files & naming

- **kebab-case** for all files/folders: `resident-card.tsx`, `stock-table.tsx`, `mock-data/residents.ts`.
- React components: PascalCase export in a kebab-case file (`export function ResidentCard()` in `resident-card.tsx`).
- **≤ 200 lines per code file.** Over → split by concern (section components, hooks, helpers). Screens compose small pieces; a `page.tsx` mostly wires sections.
- Route folders match the URL slug (`our-rooms`, `roster`, `residents/[id]`).
- **No plan-artifact references** in code, comments, or filenames — no phase numbers, finding codes, audit labels. Explain the *why*, not the origin. (Doc files may use `00-`/`01-` ordering prefixes — that's doc organization, not a code/plan reference.)

## 5. Styling

- **Tokens only.** No raw hex, px font-sizes, or inline `style={}` in JSX. Every color/size comes from a Tailwind token or CSS var defined in [01-design-system.md](./01-design-system.md).
- Port the design's inline styles → Tailwind utility classes + tokens. Match spacing/radius/shadow faithfully.
- Fonts: **Newsreader** (serif) for headings/display numbers; **Instrument Sans** (sans) for body/UI. Loaded via `next/font`.
- Use **shadcn/ui** primitives where one fits (`button`, `input`, `textarea`, `select`, `card`, `badge`, `avatar`, `separator`, `table`), themed to tokens. Bespoke sections stay custom components — don't force shadcn where it fights the design.
- Status/semantic colors (care tier, incident severity, stock level, shift status) come from the **named semantic scales** in the design-system doc, never hardcoded per-screen.

## 6. Components

- **RSC by default.** Add `"use client"` only to the smallest island that needs interactivity (role toggle, active-nav, tab filters, form inputs). Never mark a whole page client.
- Folder org: `components/marketing/`, `components/portal/`, `components/ui/` (shadcn), `components/shared/`.
- A component does one thing, takes typed props, and is understandable without reading its parent. If you can't name what it does in a phrase, split it.
- No prop drilling for role — use the `PortalRole` context.

## 7. Data

- All content comes from the **mock-data layer** `src/lib/mock-data/` — typed, one file per entity, exposed via accessor functions (`getRooms()`, `getResidentBySlug()`). See [03-data-model.md](./03-data-model.md).
- Screens/components import accessors, never inline fixtures. Swapping to Supabase later must touch **only** `lib/mock-data/` + accessors, not screens.
- Types live in `src/types/domain.ts`. Mock shapes mirror the future DB row shape (DB-ready).
- Derived/presentation values (status color, initials, occupancy %, care tier from wing) are computed in the data/accessor layer or a pure helper — not recomputed inline in JSX.

## 8. Routing & role

- Real Next.js routes (see [02-architecture.md](./02-architecture.md)). Detail screens are real nested routes with params (`/portal/rooms/[num]`, `/portal/residents/[id]`), not modal state.
- Marketing under `(marketing)` group + shared layout; portal under `/portal` + shared layout.
- **Role** (admin/staff) = client `PortalRoleProvider` context. Admin-only nav (Rooms, Stock, Incidents) hidden for Staff; Dashboard renders admin vs staff variant. No route guards this phase.

## 9. Images

- Real uploaded photos downloaded to `public/images/`. A `<Photo slot="..."/>` component maps design `image-slot` IDs → files via `next/image`, with a labelled placeholder fallback when a slot has no photo.
- Slot→file mapping table lives in [02-architecture.md](./02-architecture.md) (cross-referenced from the project screenshots).

## 10. Accessibility baseline

Semantic HTML (`header/nav/main/section/footer`, real `button`/`a`), alt text on every image, visible focus states, labelled form controls, colour never the sole signal (pair status dots with text). Not a full audit this phase, but no regressions from these basics.

## 11. Definition of Done (per screen)

1. Feature doc complete (template, no TBD).
2. Route renders at the documented URL; nav to/from it works.
3. Matches the design (layout, tokens, content) — spot-check against source lines.
4. All data via mock-data accessors; no inline fixtures or raw hex.
5. RSC/client split correct; `pnpm build` + `pnpm lint` clean.
6. Responsive: no horizontal body scroll; sensible stacking on narrow widths (design is desktop-first — degrade gracefully).
7. Out-of-scope stubs noted in the doc.
8. Screen **code + version** recorded in the doc header and in [screen-registry.md](./screen-registry.md), with a Changelog line for this change (see §12).

## 12. Screen code & version (Claude Design provenance)

Every screen ported from Claude Design carries the **code** and **version** that Claude Design assigns to it. We record them so a later changelog review reads from one place — no tracing component by component.

- **Code + version are supplied by Claude Design** — copy them verbatim, never invent them. The code is the stable per-screen identifier (e.g. `P1`); the version identifies which design revision this screen was pulled from.
- **Feature doc header** records both: `- **Code:** <code> · **Version:** <version>` (see [feature-doc-template.md](./feature-doc-template.md)).
- **Central registry** [screen-registry.md](./screen-registry.md) is the single source of truth: one row per screen — code · screen · route · current version · doc link — plus a per-screen Changelog.
- **On every re-pull from Claude Design:** if the design version changed, bump the version in the doc header **and** the registry row, and append a `Changelog` line (`<version> — <what changed>`) in both the doc and the registry. Unchanged screens keep their version.
- Code/version are **design provenance, not plan artifacts** — recording them does not violate the "no plan refs in code" rule (§4); they live in docs only, never in code/comments/filenames.

## 13. Git

Do **not** branch or commit unless explicitly asked. Leave changes as working-tree edits. Conventional commit style when asked; no AI references; no plan refs in messages.
