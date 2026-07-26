/**
 * Diffs the live wesley catalogue against supabase/seed/0009_cliffyhill_stock.sql.
 *
 * Written because the DB was found holding two negative prices that the seed
 * file does not contain - i.e. an older build of the seed was applied. Rather
 * than assume only those two drifted, this compares every product row (name,
 * category, unit, price, par) and every on-hand figure against the file.
 *
 * Read-only. Run: npx tsx scripts/db/diff-cliffyhill-seed-vs-db.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const sql = readFileSync(join(root, "supabase", "seed", "0009_cliffyhill_stock.sql"), "utf8");

/** Splits one VALUES tuple on commas that sit outside quotes. */
function cells(tuple: string): string[] {
  const out: string[] = [];
  let cur = "", quoted = false;
  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];
    if (c === "'") {
      if (quoted && tuple[i + 1] === "'") { cur += "''"; i++; continue; }
      quoted = !quoted; cur += c; continue;
    }
    if (c === "," && !quoted) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}
const unq = (v: string) => (v === "null" ? "" : v.replace(/^'|'$/g, "").replace(/''/g, "'"));

const wantProducts = new Map<string, { name: string; category: string; unit: string; price: number; par: number }>();
const wantQty = new Map<string, number>();

for (const line of sql.split("\n")) {
  const m = line.trim().match(/^\((.*)\),?$/);
  if (!m) continue;
  const c = cells(m[1]);
  if (c.length === 8) {
    // id, building, name, category, unit, price, provider, par
    wantProducts.set(unq(c[0]), {
      name: unq(c[2]), category: unq(c[3]), unit: unq(c[4]),
      price: Number(c[5]), par: Number(c[7]),
    });
  } else if (c.length === 3) {
    // product_id, building, qty
    wantQty.set(unq(c[0]), Number(c[2]));
  }
}

console.log(`Seed file: ${wantProducts.size} sản phẩm, ${wantQty.size} dòng tồn kho\n`);

const { data: prods } = await db
  .from("products").select("id,name,category,unit,price,par").eq("building_id", "wesley");
const { data: lvls } = await db
  .from("stock_levels").select("product_id,qty_now").eq("building_id", "wesley");
const gotQty = new Map((lvls ?? []).map((l) => [l.product_id, l.qty_now]));

let drift = 0;
for (const [id, want] of wantProducts) {
  const got = (prods ?? []).find((p) => p.id === id);
  if (!got) { console.log(`✗ ${id}: THIẾU trong DB`); drift++; continue; }
  const diffs: string[] = [];
  if (got.name !== want.name) diffs.push(`name "${got.name}" ≠ "${want.name}"`);
  if (got.category !== want.category) diffs.push(`category "${got.category}" ≠ "${want.category}"`);
  if ((got.unit ?? "") !== want.unit) diffs.push(`unit "${got.unit ?? ""}" ≠ "${want.unit}"`);
  if (Number(got.price) !== want.price) diffs.push(`price ${got.price} ≠ ${want.price}`);
  if (got.par !== want.par) diffs.push(`par ${got.par} ≠ ${want.par}`);
  const q = gotQty.get(id);
  if (q !== wantQty.get(id)) diffs.push(`qty ${q ?? "—"} ≠ ${wantQty.get(id)}`);
  if (diffs.length) { console.log(`✗ ${id}: ${diffs.join(" · ")}`); drift++; }
}

const extra = (prods ?? []).filter((p) => !wantProducts.has(p.id));
for (const p of extra) console.log(`✗ ${p.id}: có trong DB nhưng KHÔNG có trong seed`);

console.log(drift + extra.length === 0
  ? "\nDB khớp seed file hoàn toàn."
  : `\n${drift + extra.length} dòng lệch — DB đang chạy bản seed khác với file trên đĩa.`);
process.exit(drift + extra.length === 0 ? 0 : 1);
