/**
 * Exercises stock writes directly via pg (no RLS session - mirrors
 * verify-stock-read.mts's connection pattern since no VERIFY_EMAIL/
 * VERIFY_PASSWORD owner account is configured in .env.local yet):
 * record_stock_movement in/out (balance math), delete_stock_movement
 * (reversal). Uses temp product 'zz-verify-product'. Leaves tables clean.
 * Run: npx tsx scripts/db/verify-stock-write.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

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
const P = "zz-verify-product";

interface MovementRow {
  id: string;
  after_qty: number;
}

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();

  await client.query(
    `insert into public.products (id, building_id, name, category, unit, price, par)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (id) do update set name=excluded.name, category=excluded.category,
       unit=excluded.unit, price=excluded.price, par=excluded.par`,
    [P, B, "Verify Item", "Other", "each", 5, 10]);
  await client.query(
    `insert into public.stock_levels (product_id, building_id, qty_now) values ($1,$2,$3)
     on conflict (product_id, building_id) do update set qty_now=excluded.qty_now, updated_at=now()`,
    [P, B, 0]);

  const inn = await client.query<MovementRow>(
    `select * from public.record_stock_movement($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [P, B, "in", 8, "each", null, 5, null, null, "verify in", null, null]);
  const inRow = inn.rows[0];
  if (inRow.after_qty !== 8) throw new Error(`expected 8, got ${inRow.after_qty}`);
  console.log("✓ IN → after_qty 8");

  const out = await client.query<MovementRow>(
    `select * from public.record_stock_movement($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [P, B, "out", 3, "each", null, null,
      JSON.stringify([{ room: "01", person: "X", qty: 3 }]), "Y", "verify out", null, null]);
  const outRow = out.rows[0];
  if (outRow.after_qty !== 5) throw new Error(`expected 5, got ${outRow.after_qty}`);
  console.log("✓ OUT → after_qty 5");

  await client.query(`select public.delete_stock_movement($1)`, [outRow.id]);
  const lvl = await client.query<{ qty_now: number }>(
    `select qty_now from public.stock_levels where product_id=$1`, [P]);
  if (lvl.rows[0].qty_now !== 8) throw new Error(`reversal expected 8, got ${lvl.rows[0].qty_now}`);
  console.log("✓ delete-movement reversal → 8");

  // cleanup
  await client.query(`delete from public.stock_movements where product_id=$1`, [P]);
  await client.query(`delete from public.stock_levels where product_id=$1`, [P]);
  await client.query(`delete from public.products where id=$1`, [P]);
  await client.end();
  console.log("✓ PASS - RPC in/out, reversal, cleanup all work");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
