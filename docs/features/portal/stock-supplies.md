# Stock & supplies

- **Route:** `/portal/stock` — `app/portal/stock/page.tsx`
- **Section:** Portal · **Access:** all staff
- **Source:** `.design-src/victoria-all-screens-v3.html` lines 900–1017 (markup), 1529–1574 + 1915–1961 (logic/data)
- **Render:** RSC page → client `StockView` (tabs + order cart are stateful)

## Purpose
Track inventory, place orders to providers, and manage supplier relationships — for the **active building**. Four tabs: Inventory, Place order, Providers, Activity.

## Layout
Header (title + building sub + Auto-fill reorder) → pill tabs → active tab body.

## Sections & components
| Tab | Component | Notes |
|-----|-----------|-------|
| Header | inline | sub = `{active building} · inventory, ordering & providers`; **Auto-fill reorder** fills cart with below-par items |
| Inventory | `inventory-tab` | 4 KPIs (items / below par / in cart / cart total) + category groups with item rows (par, progress bar via `stockLevel`, status pill) |
| Place order | `order-tab` + `qty-stepper` | left: product rows with price, on-hand/par, −/qty/+ stepper; right (sticky): order draft grouped **by provider** (separate POs), subtotals, total, Place order / Clear draft |
| Providers | `providers-tab` | provider cards (avatar, category, Preferred/Approved, lead time / terms / email / phone, "New order from {name}" → order tab) |
| Activity | `stock-activity-tab` | chronological **action log** (newest first): every order placed, reorder auto-fill, cart clear, stock adjustment — with actor + timestamp + per-kind icon/colour |

## Data consumed
`getProviders()`, `getProductCatalog()`, `providerName(id)`, `suggestReorderCart()`, `getBuildingById()` (header), `stockLevel(qty, par)`, `getStockActivitySeed()` (log history).

## Variants & states (client)
- `tab` ∈ {inventory, order, providers, activity}; `cart: Cart` (`{productId: qty}`); `orderPlaced`; `activity: StockActivityEntry[]`.
- Order draft: empty state / grouped-by-provider list / success state (after Place order).
- Product row highlights when its qty > 0; stock label colored by low/reorder threshold.
- Activity log: empty state ("No stock activity yet") vs. list; newest entries prepend live as actions happen.

## Interactions
- `bumpCart(id, ±1)`, `autoFill()` (= `suggestReorderCart`), `placeOrder()` (clears cart → success), `clearCart()`. Tab + provider "New order" switch tabs. All client.

## Action logging
Every material action is recorded to the activity log so procurement is auditable and "clear" for the team. `logActions()` prepends entries with the current user (`portalIdentity(role).name`) + a `Today HH:MM` timestamp:
- **`order_placed`** — one entry per provider PO on Place order (`{n} items · ${subtotal}`), captured from the cart before it clears.
- **`reorder_autofill`** — on Auto-fill reorder (`{n} below-par items topped to par`).
- **`cart_cleared`** — on Clear draft when the cart had items.
- **`stock_adjusted`** — seed history (manual on-hand edits); wired live when inventory editing lands.

Maps to a future `stock_activity_logs` table (see `docs/03-data-model.md`) — a scoped slice of the deferred generic audit log.

## Tokens
Provider colors are **data** (inline style on avatar/badge, sanctioned). Stock status via `stockLevel().swatch`. Active tab `bg-navy-deep text-cream`; order-draft header `bg-navy-deep`; Place order button `bg-navy`; KPI/total numbers `font-serif`. Progress-bar width computed inline (sanctioned).

## Out of scope (this phase)
Persisting orders / sending POs, real inventory mutation, per-building inventory data (header name reflects selection; item data is shared this phase).

## Definition of Done
All four tabs render; stepper + auto-fill + place/clear update the cart and totals live; provider grouping correct; every order/auto-fill/clear appends a log entry (actor + timestamp) visible in the Activity tab; tokens/inline-data only; RSC page + client island; `tsc`/`lint`/`build` clean.

## Future DB notes
See 03-data-model.md → "Stock, providers & ordering": `providers`, `products` (catalog + par + price + provider FK), `stock_levels(product_id, building_id, qty_now)`, `orders` + `order_lines`. `bumpCart` is client-only until Place order → insert `orders` (one per provider) + `order_lines`; `stockLevel` reads `stock_levels`. Everything scoped by `building_id`.
