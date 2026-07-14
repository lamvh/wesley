# Stock & procurement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/portal/stock` screen to match the new design and persist everything in Supabase — editable inventory, a Stock in/out movement ledger that mutates on-hand, provider CRUD, and real purchase orders.

**Architecture:** Follows the residents pattern exactly: a `tsx` script applies the DDL migration + seeds; an async data layer (`src/lib/data/stock.ts`) reads under RLS; server actions (`src/lib/actions/stock.ts`) write under RLS; the RSC page awaits the data and hands it to the `StockView` client island. On-hand lives in `stock_levels.qty_now`; movements mutate it via an atomic Postgres RPC.

**Tech Stack:** Next.js 16 (App Router, RSC + server actions), `@supabase/ssr` + `@supabase/supabase-js`, `pg` (seed/verify scripts run with `npx tsx`), Tailwind tokens (see `src/lib/design-meta.ts`).

**Spec:** `docs/superpowers/specs/2026-07-14-stock-procurement-fullstack-design.md`

## Global Constraints

- **Git (user rule):** do NOT create branches or commit unless the user explicitly asks. The `Commit` steps below are checkpoints — leave changes as uncommitted working-tree edits unless told otherwise.
- **No test framework in this repo.** "Tests" are `tsx` verify scripts under `scripts/db/` (sign in as owner → exercise RLS ops → assert), plus `npx tsc --noEmit`, `npm run lint`, `npm run build`. Do not add jest/vitest.
- **Follow the residents pattern verbatim** — `scripts/db/seed-core-schema.mts` (migrate+seed), `scripts/db/verify-residents-write.mts` (RLS verify), `src/lib/data/residents.ts` (accessors), `src/lib/actions/residents.ts` (actions).
- **Building scope:** `building_id = 'wesley'` constant, like residents.
- **RLS posture:** `<table>_read` = `for select to authenticated using (true)`; `<table>_write` = `for all to authenticated using (true) with check (true)`.
- **No plan/phase references in code, comments, or migration filenames** — explain the *why*, not the origin.
- **File size:** keep component/module files focused (< ~200 lines); split when a file does too much.
- **Design fidelity:** exact tokens/labels from the spec §2/§5 and design-meta. Direction colours: IN `text-sage`/`bg-sage-tint`, OUT `text-rust`/`bg-rust-tint`.

---

## File Structure

**Create:**
- `supabase/migrations/0002_stock_procurement.sql` — 6 tables + RLS + `record_stock_movement`/`delete_stock_movement` RPCs
- `scripts/db/seed-stock.mts` — apply migration + seed from `stock-catalog.ts`
- `scripts/db/verify-stock-read.mts` — RLS read verify
- `scripts/db/verify-stock-write.mts` — RLS write + RPC + reversal verify
- `src/lib/data/stock.ts` — async accessors
- `src/lib/actions/stock.ts` — server actions
- `src/components/portal/stock/movements-tab.tsx` — NEW Stock in/out tab
- `src/components/portal/stock/record-movement-panel.tsx` — record IN/OUT form
- `src/components/portal/stock/movement-log.tsx` — movement table
- `src/components/portal/stock/item-history-modal.tsx` — per-item In/out history
- `src/components/portal/stock/stock-item-form.tsx` — add/edit product modal
- `src/components/portal/stock/provider-form.tsx` — add/edit provider modal
- `src/components/portal/stock/confirm-delete-modal.tsx` — shared confirm delete

**Modify:**
- `src/types/domain.ts` — add `StockMovement`, `Order`, `MovementDir`; remove `StockActivityEntry`, `StockActionKind`
- `src/app/portal/stock/page.tsx` — RSC awaits data, passes to `StockView`
- `src/components/portal/stock/stock-view.tsx` — tabs (drop `activity`, add `movements`), wire actions
- `src/components/portal/stock/inventory-tab.tsx` — editable rebuild
- `src/components/portal/stock/order-tab.tsx` — persist Place order
- `src/components/portal/stock/providers-tab.tsx` — add edit/delete
- `docs/03-data-model.md` — stock section → live
- `docs/features/portal/stock-supplies.md` — reflect new tabs/behaviour

**Delete:**
- `src/components/portal/stock/stock-activity-tab.tsx`
- `src/lib/mock-data/stock.ts` (and its `index.ts` exports); retire `stock-catalog.ts` accessors after the data layer lands (keep the file as the seed source until Task 1 copies values, then the seed script imports it directly).

---

## Task 1: Database migration, RPCs & seed

**Files:**
- Create: `supabase/migrations/0002_stock_procurement.sql`
- Create: `scripts/db/seed-stock.mts`
- Read for context: `supabase/migrations/0001_core_schema.sql`, `scripts/db/seed-core-schema.mts`, `src/lib/mock-data/stock-catalog.ts`

**Interfaces:**
- Produces (SQL): tables `providers, products, stock_levels, stock_movements, orders, order_lines`; functions `record_stock_movement(...)`, `delete_stock_movement(uuid)`.
- Produces (script): `npx tsx scripts/db/seed-stock.mts` → applies DDL + seeds, prints counts.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/0002_stock_procurement.sql`:

```sql
-- Stock, providers, movements & purchase orders for the Stock & supplies screen.
-- On-hand lives in stock_levels.qty_now; movements mutate it atomically via RPC.

create table if not exists public.providers (
  id            text primary key,
  building_id   text references public.buildings(id),
  name          text not null,
  category      text not null,
  contact_email text,
  phone         text,
  lead_time     text,
  terms         text,
  preferred     boolean not null default false,
  color         text,
  tint          text,
  created_at    timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,
  building_id text references public.buildings(id),
  name        text not null,
  category    text not null,
  unit        text,
  price       numeric(10,2) not null default 0,
  provider_id text references public.providers(id),
  par         int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.stock_levels (
  product_id  text references public.products(id) on delete cascade,
  building_id text references public.buildings(id),
  qty_now     int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (product_id, building_id)
);

create table if not exists public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  product_id  text references public.products(id) on delete cascade,
  direction   text not null,                       -- 'in' | 'out'
  qty         int not null,
  after_qty   int not null,
  unit        text,
  provider_id text references public.providers(id),
  unit_price  numeric(10,2),
  dests       jsonb,                                -- out: [{room, person, qty}]
  receiver    text,
  note        text,
  actor_id    uuid references public.app_users(id),
  moved_at    timestamptz not null default now(),
  move_date   date not null default current_date
);
create index if not exists stock_movements_product_idx
  on public.stock_movements (product_id, moved_at desc);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  building_id    text references public.buildings(id),
  provider_id    text references public.providers(id),
  status         text not null default 'draft',     -- 'draft' | 'placed'
  placed_by      uuid references public.app_users(id),
  placed_at      timestamptz,
  total_excl_gst numeric(12,2),
  created_at     timestamptz not null default now()
);

create table if not exists public.order_lines (
  order_id   uuid references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  qty        int not null,
  unit_price numeric(10,2) not null,
  primary key (order_id, product_id)
);

-- RLS: authenticated read + write (same posture as the residents phase).
alter table public.providers       enable row level security;
alter table public.products        enable row level security;
alter table public.stock_levels    enable row level security;
alter table public.stock_movements enable row level security;
alter table public.orders          enable row level security;
alter table public.order_lines     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['providers','products','stock_levels','stock_movements','orders','order_lines']
  loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Atomic: adjust on-hand + append the ledger row. security invoker → RLS applies.
create or replace function public.record_stock_movement(
  p_product_id text, p_building_id text, p_direction text, p_qty int,
  p_unit text, p_provider_id text, p_unit_price numeric, p_dests jsonb,
  p_receiver text, p_note text, p_actor_id uuid, p_move_date date
) returns public.stock_movements
language plpgsql security invoker as $$
declare v_cur int; v_new int; v_row public.stock_movements;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'qty must be positive'; end if;
  insert into public.stock_levels(product_id, building_id, qty_now)
    values (p_product_id, p_building_id, 0) on conflict do nothing;
  select qty_now into v_cur from public.stock_levels
    where product_id = p_product_id and building_id = p_building_id for update;
  v_new := greatest(0, coalesce(v_cur,0) + case when p_direction = 'in' then p_qty else -p_qty end);
  update public.stock_levels set qty_now = v_new, updated_at = now()
    where product_id = p_product_id and building_id = p_building_id;
  insert into public.stock_movements(building_id, product_id, direction, qty, after_qty,
      unit, provider_id, unit_price, dests, receiver, note, actor_id, move_date)
    values (p_building_id, p_product_id, p_direction, p_qty, v_new, p_unit,
      p_provider_id, p_unit_price, p_dests, p_receiver, p_note, p_actor_id, coalesce(p_move_date, current_date))
    returning * into v_row;
  return v_row;
end $$;

-- Atomic: reverse the balance + remove the ledger row.
create or replace function public.delete_stock_movement(p_id uuid)
returns void language plpgsql security invoker as $$
declare v public.stock_movements;
begin
  select * into v from public.stock_movements where id = p_id;
  if not found then return; end if;
  update public.stock_levels
    set qty_now = greatest(0, qty_now + case when v.direction = 'in' then -v.qty else v.qty end),
        updated_at = now()
    where product_id = v.product_id and building_id = v.building_id;
  delete from public.stock_movements where id = p_id;
end $$;

grant execute on function public.record_stock_movement(text,text,text,int,text,text,numeric,jsonb,text,text,uuid,date) to authenticated;
grant execute on function public.delete_stock_movement(uuid) to authenticated;
```

- [ ] **Step 2: Write the seed script**

Create `scripts/db/seed-stock.mts` (mirrors `seed-core-schema.mts`'s `pgConfig`/`readEnv`):

```ts
/**
 * Applies supabase/migrations/0002_stock_procurement.sql then seeds providers,
 * products, stock_levels and a few movements from the existing mock catalog.
 * Run: npx tsx scripts/db/seed-stock.mts   (connects with DIRECT_URL). Idempotent.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { getProviders, getProductCatalog } from "@/lib/mock-data/stock-catalog";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function readEnv(key: string): string | undefined {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}
function pgConfig() {
  const url = readEnv("DIRECT_URL") ?? readEnv("DATABASE_URL");
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/?]+)(?::(\d+))?\/([^?]+)/);
  if (!m) throw new Error("Could not parse DIRECT_URL / DATABASE_URL");
  const [, user, urlPw, host, port, database] = m;
  return { user, password: readEnv("SUPABASE_DB_PASSWORD") ?? urlPw, host,
    port: port ? Number(port) : 5432, database, ssl: { rejectUnauthorized: false as const } };
}
const B = "wesley";

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();
  const ddl = readFileSync(join(root, "supabase/migrations/0002_stock_procurement.sql"), "utf8");
  await client.query(ddl);
  console.log("Schema applied.");

  for (const p of getProviders()) {
    await client.query(
      `insert into public.providers (id, building_id, name, category, contact_email, phone, lead_time, terms, preferred, color, tint)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (id) do update set name=excluded.name, category=excluded.category,
         contact_email=excluded.contact_email, phone=excluded.phone, lead_time=excluded.lead_time,
         terms=excluded.terms, preferred=excluded.preferred, color=excluded.color, tint=excluded.tint`,
      [p.id, B, p.name, p.cat, p.contact, p.phone, p.lead, p.terms, p.pref, p.color, p.tint]);
  }
  for (const p of getProductCatalog()) {
    await client.query(
      `insert into public.products (id, building_id, name, category, unit, price, provider_id, par)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set name=excluded.name, category=excluded.category, unit=excluded.unit,
         price=excluded.price, provider_id=excluded.provider_id, par=excluded.par`,
      [p.id, B, p.name, p.cat, p.unit, p.price, p.prov, p.par]);
    await client.query(
      `insert into public.stock_levels (product_id, building_id, qty_now) values ($1,$2,$3)
       on conflict (product_id, building_id) do update set qty_now=excluded.qty_now, updated_at=now()`,
      [p.id, B, p.qtyNow]);
  }
  // A couple of seed movements so the ledger + per-item history render non-empty.
  await client.query(`delete from public.stock_movements where building_id=$1`, [B]);
  await client.query(
    `insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, provider_id, unit_price, note, move_date)
     values ($1,'p9','in',24,62,'carton','freshfields',28.0,'Weekly delivery', current_date - 1)`, [B]);
  await client.query(
    `insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, dests, receiver, note, move_date)
     values ($1,'p1','out',4,4,'box of 100','[{"room":"07","person":"Henry Fitzgerald","qty":4}]'::jsonb,'Mere Rangi','Room resupply', current_date)`, [B]);

  const counts = await client.query(`
    select 'providers' t, count(*) n from public.providers
    union all select 'products', count(*) from public.products
    union all select 'stock_levels', count(*) from public.stock_levels
    union all select 'stock_movements', count(*) from public.stock_movements order by t`);
  console.table(counts.rows);
  await client.end();
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Run the seed (this is the test — it applies DDL then verifies row counts)**

Run: `npx tsx scripts/db/seed-stock.mts`
Expected: `Schema applied.` then a table showing `providers 4, products 12, stock_levels 12, stock_movements 2`, then `Done.`

- [ ] **Step 4: Sanity-check the RPC**

Run:
```bash
npx tsx -e "import pg from 'pg'; import {readFileSync} from 'node:fs';
const e=(k)=>readFileSync('.env.local','utf8').split('\n').find(l=>l.startsWith(k+'='))?.split('=').slice(1).join('=').trim();
const u=e('DIRECT_URL')||e('DATABASE_URL'); const m=u.match(/postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/?]+)(?::(\d+))?\/([^?]+)/);
const c=new pg.Client({user:m[1],password:e('SUPABASE_DB_PASSWORD')||m[2],host:m[3],port:+(m[4]||5432),database:m[5],ssl:{rejectUnauthorized:false}});
await c.connect(); const r=await c.query(\"select after_qty from public.record_stock_movement('p1','wesley','in',10,'box','medsupply',12.5,null,null,'rpc test',null,null)\");
console.log('after_qty=',r.rows[0].after_qty); await c.query(\"select public.delete_stock_movement((select id from public.stock_movements order by moved_at desc limit 1))\"); await c.end();"
```
Expected: `after_qty= 14` (p1 seeded at 4, +10), and the reversal RPC runs without error.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_stock_procurement.sql scripts/db/seed-stock.mts
git commit -m "feat(stock): add procurement schema, movement RPCs and seed"
```

---

## Task 2: Domain types + data layer

**Files:**
- Modify: `src/types/domain.ts` (add stock types; leave `StockActivityEntry`/`StockActionKind` for now — removed in Task 9 with the component)
- Create: `src/lib/data/stock.ts`
- Create: `scripts/db/verify-stock-read.mts`
- Read for context: `src/lib/data/residents.ts`, `scripts/db/verify-residents-write.mts`

**Interfaces:**
- Produces: `MovementDir`, `StockMovement`, `Order` types; `getProviders()`, `getProducts()`, `getMovements(limit?)`, `getMovementsForProduct(id)`, `getOrders()` (all `async`, return camelCase domain types).
- Consumes: `Provider`, `Product` (already in `domain.ts`), `createClient` from `src/lib/supabase/server.ts`.

- [ ] **Step 1: Add types to `src/types/domain.ts`**

Append near the existing stock types:

```ts
export type MovementDir = "in" | "out";

export interface MovementDest { room: string; person: string; qty: number; }

export interface StockMovement {
  id: string;
  productId: string;
  item: string;          // product name (denormalised for display)
  unit: string;
  dir: MovementDir;
  qty: number;
  afterQty: number;      // on-hand balance after this move
  providerId?: string;   // in only
  unitPrice?: number;    // in only
  dests?: MovementDest[]; // out only
  receiver?: string;     // out only
  note?: string;
  by: string;            // actor name
  date: string;          // ISO move_date
}

export interface OrderLine { productId: string; name: string; qty: number; unitPrice: number; }
export interface Order {
  id: string;
  providerId: string;
  status: "draft" | "placed";
  placedAt?: string;
  totalExclGst: number;
  lines: OrderLine[];
}
```

- [ ] **Step 2: Write the data layer `src/lib/data/stock.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import type { Provider, Product, StockMovement, Order, MovementDir } from "@/types/domain";

const BUILDING = "wesley";

export async function getProviders(): Promise<Provider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("providers")
    .select("id,name,category,contact_email,phone,lead_time,terms,preferred,color,tint")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load providers: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, cat: r.category, contact: r.contact_email ?? "",
    phone: r.phone ?? "", lead: r.lead_time ?? "", terms: r.terms ?? "",
    pref: r.preferred, color: r.color ?? "#2C3563", tint: r.tint ?? "#E4E6F2",
  }));
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products")
    .select("id,name,category,unit,price,provider_id,par,stock_levels(qty_now)")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map((r) => {
    const lvl = Array.isArray(r.stock_levels) ? r.stock_levels[0] : r.stock_levels;
    return { id: r.id, name: r.name, cat: r.category, unit: r.unit ?? "",
      price: Number(r.price), prov: r.provider_id ?? "", par: r.par,
      qtyNow: lvl?.qty_now ?? 0 };
  });
}

function toMovement(r: Record<string, unknown>): StockMovement {
  return {
    id: r.id as string, productId: r.product_id as string,
    item: (r.item_name as string) ?? "", unit: (r.unit as string) ?? "",
    dir: r.direction as MovementDir, qty: r.qty as number, afterQty: r.after_qty as number,
    providerId: (r.provider_id as string) ?? undefined,
    unitPrice: r.unit_price != null ? Number(r.unit_price) : undefined,
    dests: (r.dests as StockMovement["dests"]) ?? undefined,
    receiver: (r.receiver as string) ?? undefined, note: (r.note as string) ?? undefined,
    by: (r.actor_name as string) ?? "", date: r.move_date as string,
  };
}

// item name + actor name are resolved via a view-ish select join.
const MOVE_COLS =
  "id,product_id,direction,qty,after_qty,unit,provider_id,unit_price,dests,receiver,note,move_date,products(name),app_users(name)";
function normalize(r: any) {
  return { ...r, item_name: r.products?.name, actor_name: r.app_users?.name };
}

export async function getMovements(limit = 100): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_movements")
    .select(MOVE_COLS).eq("building_id", BUILDING)
    .order("moved_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Failed to load movements: ${error.message}`);
  return (data ?? []).map((r) => toMovement(normalize(r)));
}

export async function getMovementsForProduct(productId: string): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_movements")
    .select(MOVE_COLS).eq("building_id", BUILDING).eq("product_id", productId)
    .order("moved_at", { ascending: false });
  if (error) throw new Error(`Failed to load item history: ${error.message}`);
  return (data ?? []).map((r) => toMovement(normalize(r)));
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders")
    .select("id,provider_id,status,placed_at,total_excl_gst,order_lines(product_id,qty,unit_price,products(name))")
    .eq("building_id", BUILDING).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id, providerId: r.provider_id, status: r.status,
    placedAt: r.placed_at ?? undefined, totalExclGst: Number(r.total_excl_gst ?? 0),
    lines: (r.order_lines ?? []).map((l: any) => ({
      productId: l.product_id, name: l.products?.name ?? "", qty: l.qty, unitPrice: Number(l.unit_price) })),
  }));
}
```

- [ ] **Step 3: Write the read verify script `scripts/db/verify-stock-read.mts`**

```ts
/**
 * Reads stock data under a real session (RLS *_read). Run:
 * npx tsx scripts/db/verify-stock-read.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => readFileSync(join(root, ".env.local"), "utf8").split("\n")
  .find((l) => l.trim().startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^["']|["']$/g, "");

async function main() {
  const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const s = await sb.auth.signInWithPassword({ email: env("VERIFY_EMAIL")!, password: env("VERIFY_PASSWORD")! });
  if (s.error) throw new Error(`sign-in failed: ${s.error.message}`);
  for (const t of ["providers", "products", "stock_movements"]) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${t}: ${error.message}`);
    console.log(`✓ ${t}: ${count} rows`);
  }
  const { data } = await sb.from("products").select("id,par,stock_levels(qty_now)").limit(1);
  console.log("✓ product+level join ok:", JSON.stringify(data?.[0]));
  console.log("✓ PASS — stock reads work under RLS");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
```

> Note: `VERIFY_EMAIL` / `VERIFY_PASSWORD` must exist in `.env.local` (the owner account used by `verify-residents-write.mts`). If absent, add them with the working owner credentials.

- [ ] **Step 4: Run typecheck + the read verify**

Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npx tsx scripts/db/verify-stock-read.mts`
Expected: `✓ providers: 4 rows`, `✓ products: 12 rows`, `✓ stock_movements: 2 rows`, join line, `✓ PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/types/domain.ts src/lib/data/stock.ts scripts/db/verify-stock-read.mts
git commit -m "feat(stock): add stock domain types and Supabase data layer"
```

---

## Task 3: Server actions

**Files:**
- Create: `src/lib/actions/stock.ts`
- Create: `scripts/db/verify-stock-write.mts`
- Read for context: `src/lib/actions/residents.ts`

**Interfaces:**
- Produces: `saveProduct(prev, fd)`, `deleteProduct(fd)`, `saveProvider(prev, fd)`, `deleteProvider(fd)`, `recordMovement(prev, fd)`, `deleteMovement(fd)`, `placeOrder(fd)` — all `"use server"`, `revalidatePath("/portal/stock")`.
- Form state shape: `interface StockFormState { error?: string }`.

- [ ] **Step 1: Write `src/lib/actions/stock.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";

const BUILDING = "wesley";
export interface StockFormState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v ? Number(v) : 0; };

export async function saveProduct(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const fields = { name, category: str(fd, "category") || "Other", unit: str(fd, "unit") || null,
    price: num(fd, "price"), provider_id: str(fd, "provider") || null, par: num(fd, "par") };
  const supabase = await createClient();
  const pid = id || `p-${Date.now()}`;
  const { error } = await supabase.from("products")
    .upsert({ id: pid, building_id: BUILDING, ...fields });
  if (error) return { error: error.message };
  const { error: le } = await supabase.from("stock_levels")
    .upsert({ product_id: pid, building_id: BUILDING, qty_now: num(fd, "qty"), updated_at: new Date().toISOString() });
  if (le) return { error: le.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteProduct(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove product: ${error.message}`);
  revalidatePath("/portal/stock");
}

export async function saveProvider(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const fields = { name, category: str(fd, "category") || "Other", contact_email: str(fd, "contact") || null,
    phone: str(fd, "phone") || null, lead_time: str(fd, "lead") || null, terms: str(fd, "terms") || null,
    preferred: str(fd, "preferred") === "true" };
  const supabase = await createClient();
  const provId = id || `prov-${Date.now()}`;
  const { error } = await supabase.from("providers")
    .upsert({ id: provId, building_id: BUILDING, ...fields });
  if (error) return { error: error.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteProvider(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("providers").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove provider: ${error.message}`);
  revalidatePath("/portal/stock");
}

export async function recordMovement(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const productId = str(fd, "productId");
  const dir = str(fd, "dir");
  if (!productId) return { error: "Choose an item." };
  if (dir !== "in" && dir !== "out") return { error: "Choose a direction." };
  const me = await getCurrentUser();
  const supabase = await createClient();

  let qty = 0; let dests: unknown = null; let receiver: string | null = null;
  let providerId: string | null = null; let unitPrice: number | null = null;
  if (dir === "in") {
    qty = num(fd, "qty");
    providerId = str(fd, "provider") || null;
    unitPrice = num(fd, "price") || null;
  } else {
    const parsed = JSON.parse(str(fd, "dests") || "[]") as { room: string; person: string; qty: number }[];
    const clean = parsed.map((d) => ({ ...d, qty: Number(d.qty) || 0 })).filter((d) => d.qty > 0);
    qty = clean.reduce((a, d) => a + d.qty, 0);
    dests = clean; receiver = str(fd, "receiver") || null;
  }
  if (qty <= 0) return { error: "Quantity must be greater than zero." };

  const { error } = await supabase.rpc("record_stock_movement", {
    p_product_id: productId, p_building_id: BUILDING, p_direction: dir, p_qty: qty,
    p_unit: str(fd, "unit") || null, p_provider_id: providerId, p_unit_price: unitPrice,
    p_dests: dests, p_receiver: receiver, p_note: str(fd, "note") || null,
    p_actor_id: me?.appUser?.id ?? null, p_move_date: str(fd, "date") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteMovement(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_stock_movement", { p_id: id });
  if (error) throw new Error(`Failed to remove movement: ${error.message}`);
  revalidatePath("/portal/stock");
}

// cart JSON: { [productId]: qty }. Splits into one order per provider.
export async function placeOrder(fd: FormData): Promise<void> {
  const cart = JSON.parse(str(fd, "cart") || "{}") as Record<string, number>;
  const ids = Object.keys(cart).filter((id) => cart[id] > 0);
  if (ids.length === 0) return;
  const me = await getCurrentUser();
  const supabase = await createClient();
  const { data: prods, error: pe } = await supabase.from("products")
    .select("id,provider_id,price").in("id", ids);
  if (pe) throw new Error(pe.message);
  const byProv = new Map<string, { productId: string; qty: number; price: number }[]>();
  for (const p of prods ?? []) {
    const prov = p.provider_id ?? "unknown";
    if (!byProv.has(prov)) byProv.set(prov, []);
    byProv.get(prov)!.push({ productId: p.id, qty: cart[p.id], price: Number(p.price) });
  }
  for (const [prov, lines] of byProv) {
    const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const { data: order, error: oe } = await supabase.from("orders")
      .insert({ building_id: BUILDING, provider_id: prov === "unknown" ? null : prov,
        status: "placed", placed_by: me?.appUser?.id ?? null,
        placed_at: new Date().toISOString(), total_excl_gst: total })
      .select("id").single();
    if (oe) throw new Error(oe.message);
    const { error: le } = await supabase.from("order_lines").insert(
      lines.map((l) => ({ order_id: order.id, product_id: l.productId, qty: l.qty, unit_price: l.price })));
    if (le) throw new Error(le.message);
  }
  revalidatePath("/portal/stock");
}
```

- [ ] **Step 2: Write the write verify script `scripts/db/verify-stock-write.mts`**

```ts
/**
 * Exercises stock writes under RLS: RPC in/out (balance math), delete-reversal,
 * order insert. Uses temp product 'zz-verify'. Leaves tables clean.
 * Run: npx tsx scripts/db/verify-stock-write.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => readFileSync(join(root, ".env.local"), "utf8").split("\n")
  .find((l) => l.trim().startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^["']|["']$/g, "");
const P = "zz-verify-product";

async function main() {
  const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const s = await sb.auth.signInWithPassword({ email: env("VERIFY_EMAIL")!, password: env("VERIFY_PASSWORD")! });
  if (s.error) throw new Error(`sign-in: ${s.error.message}`);
  await sb.from("products").upsert({ id: P, building_id: "wesley", name: "Verify Item", category: "Other", unit: "each", price: 5, par: 10 });
  await sb.from("stock_levels").upsert({ product_id: P, building_id: "wesley", qty_now: 0 });

  const inn = await sb.rpc("record_stock_movement", { p_product_id: P, p_building_id: "wesley", p_direction: "in", p_qty: 8, p_unit: "each", p_provider_id: null, p_unit_price: 5, p_dests: null, p_receiver: null, p_note: "verify in", p_actor_id: null, p_move_date: null });
  if (inn.error) throw new Error(`in rpc: ${inn.error.message}`);
  if (inn.data.after_qty !== 8) throw new Error(`expected 8, got ${inn.data.after_qty}`);
  console.log("✓ IN → after_qty 8");

  const out = await sb.rpc("record_stock_movement", { p_product_id: P, p_building_id: "wesley", p_direction: "out", p_qty: 3, p_unit: "each", p_provider_id: null, p_unit_price: null, p_dests: [{ room: "01", person: "X", qty: 3 }], p_receiver: "Y", p_note: "verify out", p_actor_id: null, p_move_date: null });
  if (out.error) throw new Error(`out rpc: ${out.error.message}`);
  if (out.data.after_qty !== 5) throw new Error(`expected 5, got ${out.data.after_qty}`);
  console.log("✓ OUT → after_qty 5");

  await sb.rpc("delete_stock_movement", { p_id: out.data.id });
  const lvl = await sb.from("stock_levels").select("qty_now").eq("product_id", P).single();
  if (lvl.data!.qty_now !== 8) throw new Error(`reversal expected 8, got ${lvl.data!.qty_now}`);
  console.log("✓ delete-movement reversal → 8");

  // cleanup
  await sb.from("stock_movements").delete().eq("product_id", P);
  await sb.from("stock_levels").delete().eq("product_id", P);
  await sb.from("products").delete().eq("id", P);
  console.log("✓ PASS — RPC in/out, reversal, cleanup all work under RLS");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 3: Run typecheck + write verify**

Run: `npx tsc --noEmit` → no errors.
Run: `npx tsx scripts/db/verify-stock-write.mts`
Expected: `✓ IN → after_qty 8`, `✓ OUT → after_qty 5`, `✓ delete-movement reversal → 8`, `✓ PASS`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/stock.ts scripts/db/verify-stock-write.mts
git commit -m "feat(stock): add stock server actions (product/provider/movement/order)"
```

---

## Task 4: RSC page + StockView shell (tabs)

**Files:**
- Modify: `src/app/portal/stock/page.tsx`
- Modify: `src/components/portal/stock/stock-view.tsx`
- Read for context: `src/app/portal/residents/page.tsx`

**Interfaces:**
- Consumes: `getProviders`, `getProducts`, `getMovements`, `getOrders` (Task 2).
- Produces: `StockView` props `{ providers, products, movements, orders }`; tab keys `inventory | movements | order | providers`.

- [ ] **Step 1: Make the page an RSC that awaits data**

Replace `src/app/portal/stock/page.tsx`:

```tsx
import { StockView } from "@/components/portal/stock/stock-view";
import { getProviders, getProducts, getMovements, getOrders } from "@/lib/data/stock";

// Admin stock & supplies: inventory, movements, ordering and providers.
// RSC shell loads Supabase data; StockView is the interactive client island.
export default async function StockPage() {
  const [providers, products, movements, orders] = await Promise.all([
    getProviders(), getProducts(), getMovements(), getOrders(),
  ]);
  return <StockView providers={providers} products={products} movements={movements} orders={orders} />;
}
```

- [ ] **Step 2: Rework `stock-view.tsx` tabs + props**

Change the `Tab` union to `"inventory" | "movements" | "order" | "providers"`; update `TABS` labels to `Inventory / Stock in/out / Place order / Providers`; accept the four data props; keep the pill tab bar; render `<InventoryTab/>`, `<MovementsTab/>`, `<OrderTab/>`, `<ProvidersTab/>`. Header action button swaps per tab (Inventory `+ Add item`, Stock in/out `View inventory`, Place order `Auto-fill reorder`, Providers `+ Add provider`). Keep the cart state client-side; move the reorder auto-fill to derive from `products` (`par - qtyNow`). Wire modal open-state (`editProduct`, `editProvider`, `historyProductId`, `confirmDelete`).

> Full component wiring is detailed alongside each tab in Tasks 5–8; this step establishes the shell + prop threading and leaves the four tab bodies referencing existing components (still compiling).

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit` → no errors.
Run: `npm run build` → succeeds (the page compiles; tabs may still show interim content).

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/stock/page.tsx src/components/portal/stock/stock-view.tsx
git commit -m "feat(stock): load stock screen from Supabase, add movements tab shell"
```

---

## Task 5: Inventory tab (editable) + item form + history modal

**Files:**
- Modify: `src/components/portal/stock/inventory-tab.tsx`
- Create: `src/components/portal/stock/stock-item-form.tsx`
- Create: `src/components/portal/stock/item-history-modal.tsx`
- Create: `src/components/portal/stock/confirm-delete-modal.tsx`
- Read for context: `src/components/portal/residents/resident-form.tsx` (form + `useActionState` pattern), spec §5 + design extraction §3.

**Interfaces:**
- Consumes: `products: Product[]`, actions `saveProduct`/`deleteProduct`, `getMovementsForProduct` (via a server action or passed history), `stockLevel()` from `design-meta`.
- Produces: KPIs (Items tracked / Low stock / Reorder now / On order), search (`stockQuery`), category chips (`stockCatFilter`), low-only toggle, rows with history/edit/delete.

- [ ] **Step 1: Build `confirm-delete-modal.tsx`** — a controlled modal: props `{ open, label, body?, onCancel, onConfirm }`; overlay `bg-[rgba(30,34,52,.48)]`, sheet `bg-cream`, `Remove {label}?` heading, Cancel + Remove (`text-rust`/`bg-rust`) buttons. (~40 lines.)

- [ ] **Step 2: Build `stock-item-form.tsx`** — modal form using `useActionState(saveProduct, {})`; hidden `id` (edit), fields: name, category `<select>` (Clinical & PPE / Continence / Housekeeping / Kitchen & Nutrition / Other), unit, par (number), qty (number), provider `<select>` (from `providers`), price (number). Submit button "Add item"/"Save changes"; shows `state.error`. On success the action `revalidatePath`s; close via an `onClose` passed from `StockView`. (~90 lines.)

- [ ] **Step 3: Build `item-history-modal.tsx`** — props `{ open, product, moves, onClose }`; header title = product name + "In/out history"; two tiles Total received `+Σin` (`text-sage`/`bg-sage-tint`) and Total issued `−Σout` (`text-rust`/`bg-rust-tint`); rows Date | Move `±qty` | Details | On hand; empty state "No stock in or out recorded for this item yet." `moves` is fetched by a thin server action `getItemHistory(productId)` wrapping `getMovementsForProduct`. (~80 lines.)

- [ ] **Step 4: Rebuild `inventory-tab.tsx`** — KPIs from `products` (Items tracked = length; Low stock = `qtyNow < par`; Reorder now = `qtyNow < par*0.5`; On order = count of `orders.status==='placed'` lines or static "—"); search input filtering `name+provider`; category chips (`All` + present categories); "Low stock only" toggle; result count; rows: status dot/name+`Par {par} {unit} · {providerName} · ${price}`/progress bar (`stockLevel(qtyNow,par).pct`)/`{qtyNow} {unit}`/status pill/actions (history → `onHistory(id)`, edit → `onEdit(product)`, delete → `onDelete(product)`). Header `+ Add item` opens the form with a blank product. (~150 lines — split the KPI row into a small `stat-tile` reuse if it grows.)

- [ ] **Step 5: Add `getItemHistory` server action** in `src/lib/actions/stock.ts`:

```ts
export async function getItemHistory(productId: string) {
  const { getMovementsForProduct } = await import("@/lib/data/stock");
  return getMovementsForProduct(productId);
}
```

- [ ] **Step 6: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. Manually load `/portal/stock` (Inventory tab): rows render from DB, add/edit/delete a temp item works, history modal opens.

- [ ] **Step 7: Commit**

```bash
git add src/components/portal/stock/inventory-tab.tsx src/components/portal/stock/stock-item-form.tsx src/components/portal/stock/item-history-modal.tsx src/components/portal/stock/confirm-delete-modal.tsx src/lib/actions/stock.ts
git commit -m "feat(stock): editable inventory tab with item form and history modal"
```

---

## Task 6: Stock in/out (movements) tab

**Files:**
- Create: `src/components/portal/stock/movement-log.tsx`
- Create: `src/components/portal/stock/record-movement-panel.tsx`
- Create: `src/components/portal/stock/movements-tab.tsx`
- Read for context: design extraction §4 (Stock in/out), `order-tab.tsx` (sticky-panel layout).

**Interfaces:**
- Consumes: `movements: StockMovement[]`, `products`, `providers`, actions `recordMovement`/`deleteMovement`.
- Produces: `MovementsTab` rendered when `tab==="movements"`.

- [ ] **Step 1: Build `movement-log.tsx`** — table grid `104px 1.4fr 78px 1.9fr 92px 44px` → Date | Item | Move | Details | On hand | (delete). Per row: date + actor sub; item; pill `{dir==='in'?'+':'−'}{qty} {unit}` coloured IN `text-sage`/`bg-sage-tint` / OUT `text-rust`/`bg-rust-tint`; details (IN → provider name; OUT → rooms/persons + "→ {receiver}"), note sub if present; `afterQty {unit}`; delete button → `onDelete(id)`. Empty: "No movements yet. Record a stock in or stock out to start the log." (~90 lines.)

- [ ] **Step 2: Build `record-movement-panel.tsx`** — sticky dark panel; `useActionState(recordMovement, {})`; direction segmented toggle (`in`/`out`, hidden input `dir`); item `<select>` (products); date input; **IN block** (qty, provider `<select>`, unit price); **OUT block** (repeatable dest rows room `<select>`/person input/qty input with add/remove — serialised to a hidden `dests` JSON input; received-by input); note input; submit `Record stock in`/`Record stock out`. Uses local React state for the dest rows + direction, writes them into hidden inputs on submit. (~150 lines — if it exceeds, split the dest-rows editor into `dest-rows.tsx`.)

- [ ] **Step 3: Build `movements-tab.tsx`** — KPI row (3 cards, default labels **Stock in (7d) / Stock out (7d) / Net (7d)** computed from `movements` filtered to last 7 days) + two-column grid `1fr 372px`: `<MovementLog/>` left, `<RecordMovementPanel/>` right. Pass `onDelete` → confirm modal → `deleteMovement`. (~70 lines.)

- [ ] **Step 4: Typecheck, lint, build + manual**

Run: `npx tsc --noEmit && npm run lint && npm run build` → clean.
Manual: record an IN (qty raises on-hand on Inventory tab), record an OUT to a room (lowers on-hand), delete a movement (reverses). KPIs reflect the last 7 days.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/stock/movement-log.tsx src/components/portal/stock/record-movement-panel.tsx src/components/portal/stock/movements-tab.tsx
git commit -m "feat(stock): add Stock in/out movement ledger tab"
```

---

## Task 7: Providers tab CRUD

**Files:**
- Modify: `src/components/portal/stock/providers-tab.tsx`
- Create: `src/components/portal/stock/provider-form.tsx`
- Read for context: design extraction §6.

**Interfaces:**
- Consumes: `providers`, actions `saveProvider`/`deleteProvider`.
- Produces: provider cards with Edit/Delete + `New order` (switches to order tab); add via header `+ Add provider`.

- [ ] **Step 1: Build `provider-form.tsx`** — modal, `useActionState(saveProvider, {})`; hidden `id`; fields: name, category `<select>`, status segmented Preferred/Approved (hidden `preferred` = "true"/"false"), contact email, phone, lead time, terms. Submit "Add provider"/"Save changes". (~90 lines.)

- [ ] **Step 2: Add edit/delete to `providers-tab.tsx`** — on each card add pencil (`onEdit(provider)`) + trash (`onDelete(provider)`) icon buttons (tokens: edit navy, delete `text-rust`). Header `+ Add provider` opens blank form. Keep the existing `New order from {name}` button. Counts header `{n} approved suppliers · {m} preferred`.

- [ ] **Step 3: Typecheck, lint, build + manual**

Run: `npx tsc --noEmit && npm run lint && npm run build` → clean.
Manual: add/edit/delete a temp provider; confirm modal guards delete.

- [ ] **Step 4: Commit**

```bash
git add src/components/portal/stock/providers-tab.tsx src/components/portal/stock/provider-form.tsx
git commit -m "feat(stock): provider add/edit/delete"
```

---

## Task 8: Order tab persistence

**Files:**
- Modify: `src/components/portal/stock/order-tab.tsx`
- Modify: `src/components/portal/stock/stock-view.tsx` (wire `placeOrder`)
- Read for context: existing `order-tab.tsx`, action `placeOrder` (Task 3).

**Interfaces:**
- Consumes: `products`, `providers`, `placeOrder(fd)`.
- Produces: Place order posts the client cart as JSON to `placeOrder`; on success shows the "Order sent" state and clears the cart.

- [ ] **Step 1: Wire `placeOrder`** — in `StockView`, replace the mock `placeOrder` state handler with a call that builds a `FormData` (`cart` = JSON of `{productId: qty}`) and invokes the `placeOrder` server action, then clears the cart and sets `orderPlaced`. Keep the client cart/stepper UX from the current `order-tab.tsx`; the auto-fill reorder derives from `products` (`par - qtyNow > 0`).

- [ ] **Step 2: Typecheck, lint, build + manual**

Run: `npx tsc --noEmit && npm run lint && npm run build` → clean.
Manual: add items to the cart, Place order → "Order sent"; verify a row lands in `orders` + `order_lines` (via `verify-stock-read` extended, or a quick psql count).

- [ ] **Step 3: Commit**

```bash
git add src/components/portal/stock/order-tab.tsx src/components/portal/stock/stock-view.tsx
git commit -m "feat(stock): persist purchase orders on Place order"
```

---

## Task 9: Cleanup, nav copy & docs

**Files:**
- Delete: `src/components/portal/stock/stock-activity-tab.tsx`
- Modify: `src/types/domain.ts` (remove `StockActivityEntry`, `StockActionKind`)
- Modify: `src/lib/mock-data/index.ts` (drop `stock.ts` / activity exports), delete `src/lib/mock-data/stock.ts`
- Modify: `docs/03-data-model.md`, `docs/features/portal/stock-supplies.md`

**Interfaces:** none produced; this removes dead code and syncs docs.

- [ ] **Step 1: Delete the activity tab + types**

Remove `stock-activity-tab.tsx`; delete `StockActivityEntry` + `StockActionKind` from `domain.ts`; delete `src/lib/mock-data/stock.ts` and its `index.ts` exports (`getStockGroups`, `getStockKpis`, and the activity seed).

- [ ] **Step 2: Grep for dangling references**

Run: `grep -rn "StockActivity\|stock-activity\|getStockActivitySeed\|getStockGroups\|getStockKpis" src/`
Expected: no results (all removed/rewired).

- [ ] **Step 3: Update docs**

Rewrite `docs/features/portal/stock-supplies.md` for the new tabs (Inventory editable / Stock in/out ledger / Place order persisted / Providers CRUD) and the Supabase data flow. In `docs/03-data-model.md`, move the Stock section from "deferred" to "live" and record the applied tables + RPCs + row counts.

- [ ] **Step 4: Full gate**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean, no unused-import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(stock): remove activity log, sync docs to procurement design"
```

---

## Self-Review

**Spec coverage:**
- §2 tabs/title/header buttons → Tasks 4–8. ✓
- §3 schema (6 tables + RLS + seed) → Task 1. ✓
- §4 data layer + actions (all 7 + RPC) → Tasks 2, 3. ✓
- §5 frontend (all components incl. movements, item form, history, provider form, confirm delete) → Tasks 4–8. ✓
- §6 types (add new, remove old) → Task 2 (add) + Task 9 (remove). ✓
- §7 decisions: unify seeds (Task 1 single `products`), building scope (constant), OUT text/jsonb (schema), moveKpis default labels (Task 6), atomic RPC (Task 1), remove Activity (Task 9). ✓
- §9 DoD (migration applied+seeded, tabs render from Supabase, reversal, gates, docs) → Tasks 1–9. ✓

**Placeholder scan:** Backend tasks (1–3) carry complete code + runnable verifies. Frontend tasks (5–8) specify exact props, fields, tokens, labels, and layout grids with per-component line budgets rather than full literal JSX — the components are close adaptations of existing files (`resident-form`, `order-tab`, `providers-tab`) named for context. Acceptable per "follow established patterns"; no `TBD`/"handle edge cases"/"similar to Task N".

**Type consistency:** `StockMovement`/`Order`/`MovementDir` defined in Task 2 and consumed unchanged in Tasks 3–8; action names (`saveProduct`, `deleteProduct`, `saveProvider`, `deleteProvider`, `recordMovement`, `deleteMovement`, `placeOrder`, `getItemHistory`) are stable across the plan; RPC arg names match between the migration, `verify-stock-write`, and `recordMovement`.

## Open items carried from the spec
1. `moveKpis` labels — using **Stock in / Stock out / Net (7d)** (§7.4); confirm against a complete design file if it becomes available.
2. `On order` inventory KPI — computed from placed orders vs a static "—"; confirm preference.
3. Order-history UI — none this pass (persist-only).
