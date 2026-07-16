# Feature Doc Template

Every screen/feature doc in `docs/features/**` follows this. Fill every section — no `TBD`. Sacrifice grammar for concision. Cite the design source (`.design-src/victoria-all-screens.html`) by line range.

---

```markdown
# <Screen name>

- **Code:** `<claude-design code, e.g. P1>` · **Version:** `<claude-design version>`
- **Route:** `<url>` — `app/<path>/page.tsx`
- **Section:** Marketing | Portal · **Access:** both | admin
- **Source:** lines `<a>–<b>`
- **Render:** RSC (+ client islands: <list or none>)

## Purpose
1–2 lines: what this screen is for, who uses it.

## Layout
Top-to-bottom structure. The wrapping layout (MarketingLayout / PortalLayout) is assumed — describe only this screen's body.

## Sections & components
Ordered list. For each: what it shows + the component that renders it (new or reused). Note grid columns / key spacing.

| Section | Component | Notes |
|---------|-----------|-------|

## Data consumed
Accessors + entities from `lib/mock-data` (see 03-data-model.md). Name each field used.

## Variants & states
Role differences, occupied/empty, status-driven styling, empty states, hover states.

## Interactions
Clicks/nav (target route), toggles, filters. Mark inert stubs explicitly (this phase).

## Tokens
Notable design-system tokens/semantic scales used (see 01-design-system.md).

## Out of scope (this phase)
Buttons/features present visually but inert (submit, search, mutate). List them.

## Definition of Done
Screen-specific acceptance beyond the global DoD (00-rules §11).

## Changelog
Code + version from Claude Design (see 00-rules §12). Newest first; one line per re-pull.
- `<version>` — <what changed / initial port>
```
