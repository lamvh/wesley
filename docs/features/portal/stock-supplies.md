# Stock & supplies

- **Route:** `/portal/stock` — `app/portal/stock/page.tsx`
- **Section:** Portal · **Access:** admin
- **Source:** lines `801–831` (screen) + `1194–1215` (`mkItem`, `stockGroups`, `stockKpis` data)
- **Render:** RSC (no client islands — static content, inert button only)

## Purpose
Admin inventory dashboard: live stock levels across clinical, continence, housekeeping & kitchen supplies so the facility manager can spot low/reorder items at a glance. Admin-only (source `pStock`, gated with the Administration nav group).

## Layout
Single centred column inside `PortalLayout`, `max-width:1180px`, top-to-bottom:
1. **Header row** — flex, title/subtitle left, "+ Receive delivery" button right (`align-items:flex-end`, `justify-content:space-between`, wraps).
2. **KPI row** — 4-col grid (`repeat(4,1fr)`, gap `16px`), margin-top `22px`. One `KpiCard` per `stockKpis` entry.
3. **Category groups** — vertical stack (`flex-col`, gap `16px`), margin-top `16px`. One `StockGroup` per `stockGroups` entry (4 groups).

## Sections & components

| Section | Component | Notes |
|---------|-----------|-------|
| Header | `PortalPageHeader` (shared) | Props: `title` ("Stock & supplies", Newsreader `32px`/500), `subtitle` ("Live inventory across clinical, continence, housekeeping & kitchen", `muted` `15px`), `action` slot. Source 804. |
| Receive-delivery button | `Button` (shadcn, `variant=primary`) | Accent fill (`accent`→navy), cream text, radius `11px`, pad `9px 16px`, `14px`/600. Label "+ Receive delivery". Inert this phase. Source 805. |
| KPI row | `page.tsx` grid section | `repeat(4,1fr)` gap `16px`. Maps `stockKpis` → `KpiCard`. Source 807–811. |
| KPI card (×4) | `kpi-card` (shared `components/shared/kpi-card.tsx`) | `cream-2` surface, `border` outline, radius `16px`, pad `18px 20px`. Label (`muted-2` `13px`/600), value (Newsreader `30px`, colour from entry), sub (`muted-2` `12.5px`). Reused by incidents/dashboard. Source 809. |
| Category group (×4) | `stock-group` (new `components/portal/stock-group.tsx`) | `cream-2` surface, `border` outline, radius `16px`, `overflow:hidden`. Header strip (`border-2` bottom divider, pad `15px 20px`): group title (`g.cat`, Newsreader `19px`/600, flex `1`) + item count (`{count} items`, `muted-2` `12.5px`). Body maps `g.items` → `stock-item-row`. Source 814–828. |
| Item row (×n) | `stock-item-row` (new `components/portal/stock-item-row.tsx`) | Flex, gap `18px`, pad `13px 20px`, bottom divider `#F0E9DA`. Cells: status dot (9×9 circle, `it.dot`) · name+par block (flex `1`; name `14.5px`/600 `ink`, "Par level {par} {unit}" `muted-2` `12.5px`) · progress bar (width `180px`) · qty ("{qty} {unit}", width `96px`, right, `14px`/600 `ink-soft`) · status pill (width `96px`, right; text `it.status`, colour `it.dot`, bg `it.tint`, radius pill). Source 818–824. |
| Progress bar | inline in `stock-item-row` | Track `7px` tall, `field`-tint bg (`#EAE0CE`), radius pill; fill width `it.pct`, bg `it.dot`, radius pill. Source 821. |

## Data consumed
From `lib/mock-data/stock.ts` (see 03-data-model.md):
- `getStockGroups()` → `StockGroup[]` (4 groups, source order: Clinical & PPE, Continence, Housekeeping, Kitchen & Nutrition). Each group: `category` (`cat`) + `items: SupplyItem[]`, `count` derived (`items.length`). Source `stockGroups` lines 1204–1209.
- `SupplyItem` raw fields: `name`, `qty`, `par`, `unit`. Source `mkItem` inputs lines 1205–1208.
- Derived per item via `stockStatus(qty, par)` helper (mirrors `mkItem` lines 1195–1203): `status` (In stock / Low / Reorder), `pct` (`min(100, round(qty/par*100))%`), and semantic `dot`/`tint` colour tokens from the stock-level scale. **Not stored** — computed in accessor/helper layer.
- `stockKpis` → `Kpi[]` (4): `label`, `value`, `sub`, plus a `color` token (ink / amber / terracotta / navy). Source lines 1210–1215.

## Variants & states
- **Admin-only** — reachable only as `role === 'admin'`. Visited as staff → "Admin only" empty state (no hard guard/redirect this phase; per 02-architecture role model).
- **Status-driven styling** — each item's dot, bar fill, and pill colour derive from `qty/par`:
  - ratio ≥ 1 → **In stock** · sage `#6E875E` / tint `#E5EBDD`.
  - 0.5 ≤ ratio < 1 → **Low** · amber `#b0894a` / tint `#EDE6D3`.
  - ratio < 0.5 → **Reorder** · terracotta `#BE7350` / tint `#F1E0D3`.
  - Bar `pct` capped at 100% (over-par items like Wound dressings 48/40 show full bar, In-stock pill).
- **Static list** — 4 fixed groups, item counts 4/3/3/3; no empty/loading state (mock data fixed).
- **Colour never sole signal** — status pill pairs colour with text label; dot pairs with name.
- Responsive: KPI grid collapses (4→2→1) on narrow widths; item row's fixed-width cells wrap/stack gracefully; no horizontal body scroll.

## Interactions
- **+ Receive delivery** button — inert this phase (`console`-noop; source has no handler, static button line 805). No modal/form.
- No row clicks, filters, sorting, or search — rows are read-only display.
- Sidebar nav + role toggle come from `PortalLayout` (out of this doc's scope).

## Tokens
- Surfaces: `cream-2` (`#FCFAF4`) cards, `border` (`#E7DECD`) outlines, `border-2` (`#EEE6D6`) group-header divider, `#F0E9DA` row divider, `field` (`#EAE0CE`) bar track.
- **Stock / alert level semantic scale** (01-design-system.md): In stock sage `#6E875E`/`#E5EBDD` · Low amber `#b0894a`/`#EDE6D3` · Reorder terracotta `#BE7350`/`#F1E0D3` — referenced by name via `stockStatus`, never hardcoded per row.
- Text: `ink` (`#2B2720`) item names, `ink-soft` (`#3B362D`) qty, `muted-2` (`#948B7B`/`#857B6C`) labels/meta.
- Accent: `accent` (defaults navy `#2C3563`) primary button; `cream` button text.
- KPI value colours: ink `#2B2720`, amber `#b0894a`, terracotta `#BE7350`, navy `#2C3563` (stored per KPI, from stock scale).
- Type: Newsreader H1 `32px`/500, group title `19px`/600, KPI value `30px`; Instrument Sans body/labels/pills.
- Radius: cards `16px`, button `11px`, bar/pill `100px`. Group gap `16px`, main pad `30px`, `max-width:1180px`.

## Out of scope (this phase)
- **+ Receive delivery** button — visually present, inert (no delivery form, no mutation).
- No stock editing, par-level adjustment, reorder actions, or order tracking (the "On order" KPI is static text).
- No filtering by category/status, no search, no sort.
- No detail drill-down per item.

## Definition of Done
Beyond global DoD (00-rules §11):
1. 4 `StockGroup`s render in source order (Clinical & PPE, Continence, Housekeeping, Kitchen & Nutrition) with correct item counts (4/3/3/3).
2. Each `stock-item-row` shows dot, name, "Par level {par} {unit}", progress bar at `pct`, "{qty} {unit}", and status pill — all colours from `stockStatus`, no raw hex in JSX.
3. Status derivation matches `mkItem` thresholds (≥1 In stock / ≥0.5 Low / <0.5 Reorder) and `pct` cap at 100%; spot-check Nitrile gloves 4/20 → Reorder 20%, Wound dressings 48/40 → In stock 100%.
4. 4 `KpiCard`s render from `stockKpis` with per-KPI value colour.
5. All data via `getStockGroups()` / `stockKpis` accessors — no inline fixtures.
6. Visited as staff → "Admin only" empty state; admin nav shows Stock item.
