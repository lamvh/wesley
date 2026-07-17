# Stock & supplies

- **Route:** `/portal/stock` - `app/portal/stock/page.tsx`
- **Section:** Portal · **Access:** all staff
- **Render:** RSC page fetches Supabase data → client `StockView` (tabs, forms, cart are stateful)

## Purpose
Track inventory, log stock movements, place provider orders, and manage supplier relationships - for the **active building** (`wesley`, constant this phase). Four tabs: **Inventory**, **Stock in/out**, **Place order**, **Providers**.

## Layout
Header (title + building sub + tab-specific action button) → pill tabs → active tab body.

## Sections & components
| Tab | Component | Notes |
|-----|-----------|-------|
| Header | inline | sub = `{active building} · inventory, stock in/out, ordering & providers`; action button swaps per tab (`+ Add item` / `View inventory` / `Auto-fill reorder` / `+ Add provider`) |
| Inventory | `inventory-tab` + `stock-group` + `stock-item-row` | **Editable** catalog. 4 KPIs (items tracked / low stock / reorder now / on order - placed-order line count), search + low-stock toggle, category chips, category groups with item rows (par, progress bar via `stockLevel`, status pill, edit/history/delete actions) |
| Stock in/out | `movements-tab` + `movement-log` + `record-movement-panel` | Movement **ledger**. 3 rolling-7-day KPIs (stock in / stock out / net), two-column grid: global log (left, deletable) + record-movement form (right, in vs out direction) |
| Place order | `order-tab` + `qty-stepper` | Left: product rows with price, on-hand/par, −/qty/+ stepper. Right (sticky): order draft grouped **by provider** (separate POs), subtotals, total, Place order / Clear draft - **persists** to Supabase |
| Providers | `providers-tab` | Provider **CRUD** cards (avatar, category, Preferred/Approved, lead time / terms / email / phone, edit/delete, "New order from {name}" → order tab) |

Shared modals (owned by `StockView`): `stock-item-form` (add/edit product), `provider-form` (add/edit provider), `item-history-modal` (per-product movement history via `getItemHistory`), `confirm-delete-modal` (products, providers, movements all route through one confirm dialog).

## Data flow (Supabase)
RSC `page.tsx` calls `src/lib/data/stock.ts` (`getProviders`, `getProducts`, `getMovements`, `getOrders`) and passes the results into `<StockView>` as props - no client-side fetching for initial load. Writes go through Server Actions in `src/lib/actions/stock.ts`:

- `saveProduct` / `deleteProduct` - upsert/delete `products` (+ `stock_levels` on save).
- `saveProvider` / `deleteProvider` - upsert/delete `providers`.
- `recordMovement` / `deleteMovement` - call the `record_stock_movement` / `delete_stock_movement` RPCs (atomic: adjust `stock_levels.qty_now` + append/remove the `stock_movements` ledger row in one transaction).
- `placeOrder` - splits the draft cart by `products.provider_id` into one `orders` row per provider (`status: "placed"`) + `order_lines`.
- `getItemHistory` - thin wrapper around `getMovementsForProduct` for the history modal.

All actions `revalidatePath("/portal/stock")` on success. RLS: `{table}_read`/`{table}_write` policies, authenticated-only (see `docs/03-data-model.md`).

## Variants & states (client)
- `tab` ∈ {inventory, movements, order, providers}; `cart: Record<productId, qty>`; `orderPlaced`.
- Item/provider forms: add mode (`editProduct`/`editProvider` = null) vs edit mode (populated).
- Order draft: empty state / grouped-by-provider list / success state (after Place order clears the cart).
- Inventory row highlights + stock label colored by low/reorder threshold (`stockLevel`).

## Interactions
- `bumpCartQty(id, ±1)`, `autoFillReorder()` (tops every below-par product to par), `placeCartOrder()` (calls `placeOrder` action, clears cart → success state), `clearCart()`.
- Tab switch + provider "New order" button switch tabs. Header action button dispatches per active tab.
- Record-movement panel remounts (key bump) after a successful save so its local direction/dest-row state resets.

## Tokens
Provider colors are **data** (inline style on avatar/badge, sanctioned). Stock status via `stockLevel().swatch`. Active tab `bg-navy-deep text-cream`; order-draft header `bg-navy-deep`; Place order button `bg-navy`; KPI/total numbers `font-serif`. Progress-bar width computed inline (sanctioned).

## Definition of Done
All four tabs render live Supabase data; inventory add/edit/delete persist; stock in/out movements adjust `stock_levels.qty_now` atomically and are reversible (delete restores the balance); Place order persists an `orders` + `order_lines` row per provider; provider CRUD persists; `tsc`/`lint`/`build` clean.

## History
The former **Activity** tab (client-only action log, `stock-activity-tab.tsx` + `StockActivityEntry`/`StockActionKind` types) was removed - its audit-trail role is now covered by the persisted **Stock in/out** movement ledger, which is real (reversible, Supabase-backed) rather than a mock ephemeral log.

## Data model
See `docs/03-data-model.md` → "Stock, providers & ordering" for the live schema (`providers`, `products`, `stock_levels`, `stock_movements`, `orders`, `order_lines`), RLS, and RPCs.
