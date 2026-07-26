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
| Stock in/out | `movements-tab` + `movement-log` + `record-movement-panel` + `dest-rows` + `search-select` | Movement **ledger**. 3 rolling-7-day KPIs (stock in / stock out / net), two-column grid: global log (left, deletable) + record-movement form (right, in vs out direction). Item and destination are type-to-filter pickers, see below |
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

## Pickers (Stock in/out)
`search-select.tsx` is a small type-to-filter combobox used where a plain `<select>` stopped scaling. The visible input carries no `name` - the committed value posts through a hidden input - so what the user reads (a label) and what the form sends (an id) can differ.

- **Item** - 35 products; supplier code is searchable but not shown. Must resolve to a product id.
- **Destination** - room and resident used to be two free-text boxes; they are one picker now (`allowFreeText`). Options come from `buildRoomDestOptions()` (`lib/stock-dest-options.ts`) over the real register: one per occupant plus one per empty room, keyed `(building, room, occupant)` because room numbers repeat across the homes and The Lodge's 10B holds two people. Typing "12" or "Ian" finds the same row and picking it fills room **and** resident together, so a resident can no longer be filed against the wrong room. Destinations outside the register (the kitchens, laundry) are still accepted as typed text.

Both homes are offered, since both draw on this store, but only the other home is labelled - `MovementDest.home` is set for non-Wesley rooms only, and the movement log renders it on the same rule, so the picker's label and the stored ledger row cannot drift. `recordMovement` rebuilds each dest field by field rather than spreading the posted object, since it lands in a `jsonb` column straight from the client.

## Tokens
Provider colors are **data** (inline style on avatar/badge, sanctioned). Stock status via `stockLevel().swatch`. Active tab `bg-navy-deep text-cream`; order-draft header `bg-navy-deep`; Place order button `bg-navy`; KPI/total numbers `font-serif`. Progress-bar width computed inline (sanctioned).

## Definition of Done
All four tabs render live Supabase data; inventory add/edit/delete persist; stock in/out movements adjust `stock_levels.qty_now` atomically and are reversible (delete restores the balance); Place order persists an `orders` + `order_lines` row per provider; provider CRUD persists; `tsc`/`lint`/`build` clean.

## History
The former **Activity** tab (client-only action log, `stock-activity-tab.tsx` + `StockActivityEntry`/`StockActionKind` types) was removed - its audit-trail role is now covered by the persisted **Stock in/out** movement ledger, which is real (reversible, Supabase-backed) rather than a mock ephemeral log.

## Catalogue data
The demo catalogue (12 products, 4 providers) was replaced by the home's real CliffyHill stocktake: `scripts/db/emit-cliffyhill-stock-seed-sql.mts` → `supabase/seed/0009_cliffyhill_stock.sql`. 35 products, one provider (`cliffyhill`), `building_id = 'wesley'`. The emitter refuses to write SQL if the source fails its checks (per-row field count, duplicate ids, row count reconciling against the 39-row sheet, GST arithmetic) and **reports - never silently fixes** - anything it had to repair: negative on-hand clamped to 0, missing prices stored as 0.00, missing supplier codes replaced by name-derived ids.

Two things in the catalogue are not the home's numbers and should be treated as provisional: **par levels** (derived from qty, see `docs/03-data-model.md`) and the **8 products priced 0.00**, which cannot be ordered until the home supplies a price. `src/lib/mock-data/stock-catalog.ts` still holds the old demo catalogue but nothing imports it - the screen reads Supabase only.

## Data model
See `docs/03-data-model.md` → "Stock, providers & ordering" for the live schema (`providers`, `products`, `stock_levels`, `stock_movements`, `orders`, `order_lines`), RLS, and RPCs.
