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
