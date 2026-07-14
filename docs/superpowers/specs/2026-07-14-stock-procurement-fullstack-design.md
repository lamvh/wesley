# Stock & procurement — full-stack rebuild (design)

- **Date:** 2026-07-14
- **Status:** Draft — awaiting user review
- **Screen:** Portal · `/portal/stock` (nav label "Stock & supplies", section "Stock & procurement")
- **Design source:** `.design-src/victoria-at-mt-eden.dc.html` (`pStock` block, markup 1041–1278; logic 1965–2730). Board: `Victoria - Admin Dashboard.dc.html`.
- **Backend scope (agreed):** Full-stack — move the whole screen off mock data onto Supabase, following the residents pattern (`src/lib/data/residents.ts`, `src/lib/actions/residents.ts`, `supabase/migrations/0001_core_schema.sql`).

## 1. Goal

Rebuild the Stock screen to match the new design and persist everything in Supabase. The new design turns the passive **Activity** audit log into an active **Stock in/out** movement ledger that mutates on-hand quantities, makes **Inventory** fully editable, adds **provider CRUD**, and makes **Place order** write real purchase orders.

## 2. Tabs (was → now)

| Current build | New design |
|---|---|
| Inventory · Place order · Providers · **Activity** | Inventory · **Stock in/out** · Place order · Providers |

Screen title stays **"Stock & supplies"**; subtitle → `{building} · inventory, stock in/out, ordering & providers`. Header action button swaps per tab: Inventory `+ Add item`, Stock in/out `View inventory`, Place order `Auto-fill reorder`, Providers `+ Add provider`.

## 3. Data model — migration `supabase/migrations/0002_stock_procurement.sql`

RLS on every table: `<table>_read` (`for select to authenticated using (true)`) + `<table>_write` (`for all to authenticated using (true) with check (true)`) — same posture as the residents phase.

```sql
providers(id text pk, building_id text→buildings, name, category,
          contact_email, phone, lead_time, terms,
          preferred bool default false, color, tint, created_at)

products(id text pk, building_id text→buildings, name, category, unit,
         price numeric(10,2) default 0, provider_id text→providers,
         par int default 0, created_at)                    -- unified catalog (see §7.1)

stock_levels(product_id text→products on delete cascade, building_id text→buildings,
             qty_now int default 0, updated_at, primary key (product_id, building_id))

stock_movements(id uuid pk, building_id text→buildings,
                product_id text→products on delete cascade,
                direction text,            -- 'in' | 'out'
                qty int, after_qty int, unit text,
                provider_id text→providers,  -- in only
                unit_price numeric(10,2),    -- in only
                dests jsonb,                 -- out: [{room, person, qty}]
                receiver text,               -- out: who collected
                note text, actor_id uuid→app_users,
                moved_at timestamptz default now(), move_date date default current_date)

orders(id uuid pk, building_id text→buildings, provider_id text→providers,
       status text default 'draft',         -- 'draft' | 'placed'
       placed_by uuid→app_users, placed_at, total_excl_gst numeric(12,2), created_at)

order_lines(order_id uuid→orders on delete cascade, product_id text→products,
            qty int, unit_price numeric(10,2), primary key (order_id, product_id))
```

**On-hand lives in `stock_levels.qty_now`.** Both direct inventory edits and movements write it. Inventory status derives (client) from `qty_now` vs `products.par` via the existing `stockLevel()` helper (`< 0.5` Reorder, `< 1` Low, else In stock).

**Seed:** `supabase/seed/0002_stock_seed.sql` + `scripts/db/seed-stock.mts` (service-role, run via `npx tsx`), sourced from the existing `src/lib/mock-data/stock-catalog.ts`, `building_id = 'wesley'`. Seed a handful of `stock_movements` rows so the ledger + per-item history render non-empty.

## 4. Backend layer

**`src/lib/data/stock.ts`** (async, RLS-scoped reads; snake_case → camelCase):
- `getProviders(): Provider[]`
- `getProducts(): Product[]` — join `stock_levels` for `qtyNow`
- `getMovements(limit?): Movement[]` — newest first
- `getMovementsForProduct(productId): Movement[]` — for the history modal
- `getOrders(): Order[]` (+ lines) — for order state / history

**`src/lib/actions/stock.ts`** (`"use server"`, RLS-governed, `revalidatePath("/portal/stock")`):
- `saveProduct(fd)` — insert/update `products`; upsert `stock_levels.qty_now`
- `deleteProduct(fd)` — cascade removes stock_levels/movements refs
- `saveProvider(fd)` / `deleteProvider(fd)`
- `recordMovement(fd)` — validate; `newQty = max(0, qty_now ± qty)`; update `stock_levels`; insert `stock_movements` with `after_qty = newQty`, `actor_id = current user`. OUT: build `dests` jsonb + `qty = Σ dest qty`; IN: `provider_id` + `unit_price`.
- `deleteMovement(fd)` — reverse: `qty_now += (dir==='in' ? -qty : qty)`; delete row.
- `placeOrder(fd)` — group cart by `products.provider_id`; insert one `orders` (status `placed`, `placed_by`, `placed_at`, `total_excl_gst`) + `order_lines` per provider.

Writes that mutate qty + insert a movement should be atomic; if two round-trips are unavoidable via supabase-js, use a Postgres RPC (`record_stock_movement`) added in the migration to keep it transactional. **[decision — see §7.5]**

## 5. Frontend

RSC `page.tsx` awaits the data-layer accessors and passes them to the `StockView` client island (mirrors residents). Tabs + order cart + form state stay client-side; writes go through server actions.

Components under `src/components/portal/stock/`:
- `stock-view.tsx` — tabs (drop `activity`, add `movements`), per-tab header action button, shared state.
- `inventory-tab.tsx` — **rebuilt editable:** KPIs (Items tracked / Low stock / Reorder now / On order), search box, category chips, "Low stock only" toggle, result count; rows show status dot, name + `Par {par} {unit} · {provider} · {price}`, progress bar, qty, status pill, and **history / edit / delete** actions.
- `movements-tab.tsx` — **NEW:** movement-log table (Date | Item | Move `±qty` | Details | On hand | delete) + sticky **Record movement** panel (direction toggle; IN: qty/provider/unit-price; OUT: issue-to-rooms repeatable rows + received-by; note). Direction colours: IN green `text-sage`/`bg-sage-tint`, OUT terracotta `text-rust`/`bg-rust-tint`.
- `order-tab.tsx` — mostly unchanged; **Place order now persists** (calls `placeOrder`).
- `providers-tab.tsx` — add **edit/delete** actions + `New order`.
- `stock-item-form.tsx` (modal) — add/edit product (name, category, unit, par, qty, provider, price).
- `provider-form.tsx` (modal) — add/edit provider (name, category, Preferred/Approved, email, phone, lead, terms).
- `item-history-modal.tsx` — per-item In/out history (Total received `+N` / Total issued `−N` + that item's moves).
- `confirm-delete-modal.tsx` — shared (kinds: product, provider, movement).
- `qty-stepper.tsx`, `stock-group.tsx`, `stock-item-row.tsx` — reused/adapted.

**Remove:** `stock-activity-tab.tsx` and the `StockActivityEntry` / `StockActionKind` types (superseded by the movement ledger). `stock.ts` mock accessors retired once the data layer lands.

## 6. Types (`src/types/domain.ts`)

`Product` already matches the DB shape (`id/name/cat/unit/price/prov/par/qtyNow`) — keep as-is. Add:
```ts
type MovementDir = "in" | "out";
interface StockMovement { id; productId; item; unit; dir: MovementDir; qty; afterQty;
  providerId?; unitPrice?; dests?: {room; person; qty}[]; receiver?; note?; by; date; }
interface Order { id; providerId; status: "draft"|"placed"; placedAt?; totalExclGst; lines: {...}[] }
```
Remove `StockActivityEntry`, `StockActionKind`.

## 7. Decisions (defaults — flag any to change)

1. **Unify the two product seeds.** The design ships two divergent seeds for the same items (`stockItems` for Inventory vs `productCatalog` for Order, different unit/price/qty). We collapse to **one `products` table + `stock_levels`**; the Order tab reads the same source. (DRY; the divergence was mock sloppiness.)
2. **Building scoping:** scope to `building_id = 'wesley'` (constant, as residents does today); real per-user building scoping is a later pass.
3. **OUT destinations** (`room` / `person` / `receiver`) stored as text + `dests` jsonb — no FK to a `rooms` table (rooms aren't in the DB yet).
4. **Movement KPIs (`moveKpis`)** were past the 256 KB fetch cap — proposed default: **Stock in (7d) / Stock out (7d) / Net (7d)**. *Confirm labels.*
5. **Atomic movement write** via a `record_stock_movement` Postgres RPC (update level + insert ledger in one transaction). Alternative: two supabase-js calls (simpler, tiny race window). Default = RPC.
6. **Remove the Activity audit log.** Order/cart events are no longer separately logged; order history is represented by `orders.status`/`placed_at`.

## 8. Non-goals (this pass)

Emailing/exporting POs; receiving-against-PO auto-creating an IN movement (IN is manual); GST; barcode; multi-building switching; per-role permissions beyond the authenticated `_read`/`_write` posture.

## 9. Definition of done

- Migration `0002` applied + seeded; six tables with RLS; row counts sane.
- All four tabs render from Supabase: editable inventory (add/edit/delete, search/filter, KPIs), movements ledger (record IN/OUT mutates `qty_now`, per-item history), order (place → persisted PO), provider CRUD.
- Delete-movement reverses the balance; delete-product/provider guarded by the shared confirm modal.
- `tsc` / `lint` / `build` clean. Docs updated: `docs/03-data-model.md` (stock → live), `docs/features/portal/stock-supplies.md`.

## 10. Open questions

1. `moveKpis` exact labels (§7.4) — confirm "Stock in / Stock out / Net (7d)".
2. Should the Inventory row also surface a suggested reorder qty (`par − qtyNow`), or is the progress bar enough? (design shows bar only.)
3. Keep `orders` history visible anywhere in the UI, or persist-only for now? (design shows no order-history view.)
