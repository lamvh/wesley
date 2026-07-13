# Stock & supplies

- **Route:** `/portal/stock` — `app/portal/stock/page.tsx`
- **Section:** Portal · **Access:** all staff
- **Source:** `.design-src/victoria-all-screens-v3.html` lines 900–1017 (markup), 1529–1574 + 1915–1961 (logic/data)
- **Render:** RSC page → client `StockView` (tabs + order cart are stateful)

## Purpose
Track inventory, place orders to providers, and manage supplier relationships — for the **active building**. Three tabs: Inventory, Place order, Providers.

## Layout
Header (title + building sub + Auto-fill reorder) → pill tabs → active tab body.

## Sections & components
| Tab | Component | Notes |
|-----|-----------|-------|
| Header | inline | sub = `{active building} · inventory, ordering & providers`; **Auto-fill reorder** fills cart with below-par items |
| Inventory | `inventory-tab` | 4 KPIs (items / below par / in cart / cart total) + category groups with item rows (par, progress bar via `stockLevel`, status pill) |
| Place order | `order-tab` + `qty-stepper` | left: product rows with price, on-hand/par, −/qty/+ stepper; right (sticky): order draft grouped **by provider** (separate POs), subtotals, total, Place order / Clear draft |
| Providers | `providers-tab` | provider cards (avatar, category, Preferred/Approved, lead time / terms / email / phone, "New order from {name}" → order tab) |

## Data consumed
`getProviders()`, `getProductCatalog()`, `providerName(id)`, `suggestReorderCart()`, `getBuildingById()` (header), `stockLevel(qty, par)`.

## Variants & states (client)
- `tab` ∈ {inventory, order, providers}; `cart: Cart` (`{productId: qty}`); `orderPlaced`.
- Order draft: empty state / grouped-by-provider list / success state (after Place order).
- Product row highlights when its qty > 0; stock label colored by low/reorder threshold.

## Interactions
- `bumpCart(id, ±1)`, `autoFill()` (= `suggestReorderCart`), `placeOrder()` (clears cart → success), `clearCart()`. Tab + provider "New order" switch tabs. All client.

## Tokens
Provider colors are **data** (inline style on avatar/badge, sanctioned). Stock status via `stockLevel().swatch`. Active tab `bg-navy-deep text-cream`; order-draft header `bg-navy-deep`; Place order button `bg-navy`; KPI/total numbers `font-serif`. Progress-bar width computed inline (sanctioned).

## Out of scope (this phase)
Persisting orders / sending POs, real inventory mutation, per-building inventory data (header name reflects selection; item data is shared this phase).

## Definition of Done
All three tabs render; stepper + auto-fill + place/clear update the cart and totals live; provider grouping correct; tokens/inline-data only; RSC page + client island; `tsc`/`lint`/`build` clean.

## Future DB notes
See 03-data-model.md → "Stock, providers & ordering": `providers`, `products` (catalog + par + price + provider FK), `stock_levels(product_id, building_id, qty_now)`, `orders` + `order_lines`. `bumpCart` is client-only until Place order → insert `orders` (one per provider) + `order_lines`; `stockLevel` reads `stock_levels`. Everything scoped by `building_id`.
