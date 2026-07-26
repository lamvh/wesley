/**
 * Verifies that supabase/seed/0009_cliffyhill_stock.sql landed intact.
 *
 * The seed replaces the demo catalogue wholesale, so the risks are a partial
 * apply (rows in one table but not another) and demo rows surviving:
 *
 *   1. exactly one provider for wesley, and it is cliffyhill.
 *   2. 35 products, all pointing at cliffyhill.
 *   3. none of the demo ids (p1..p12) survive.
 *   4. every product has a stock_levels row - a product without one reads as
 *      0 on hand and cannot be moved in or out.
 *   5. no negative on-hand (the RPC clamps at 0; a negative row would mean
 *      something wrote around it).
 *   6. spot-check the numbers against the source sheet.
 *   7. the 8 unpriced products are still unpriced - they cannot be ordered,
 *      and quietly acquiring a price would mean someone guessed one.
 *
 * Read-only. Run: npx tsx scripts/db/verify-cliffyhill-stock.mts
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

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

const BUILDING = "wesley";
// Transcribed from the sheet, independently of the emitter - if both were
// generated from the same list, this would only prove the seed matches itself.
const SPOT: Record<string, { price: number; qty: number }> = {
  "igs-1250": { price: 33.87, qty: 182 },  // Matthews Interleave Toilet Tissue
  "mph-30110": { price: 50.0, qty: 119 },  // Medical Face Masks Type IIR
  "igc-12351": { price: 45.0, qty: 51 },   // Nitrile gloves M
  "grk4-20": { price: 104.6, qty: 4 },     // dishwasher detergent 20L
  "mph-2360": { price: 82.0, qty: 0 },     // bin liner 80L - sheet said -2
  "mph-34720": { price: 28.26, qty: 0 },   // A4 paper - excl-GST price derived
};
const UNPRICED = [
  "n95-mask", "bsl-rubbish-bag-kitchen-2", "bsl-rubbish-bag-lge-bin-liner-kitchen-1",
  "greenr-enzyme-all-purpose-cleaner", "bioclean-odour-neutraliser",
  "qualchem-saniclean-heavy-duty-cleaner-sanitiser", "alcohol-sanitiser-4l-75",
  "ap439-solution-5l", "sanitary-pads",
];

const { data: provs } = await db.from("providers").select("id").eq("building_id", BUILDING);
check(provs?.length === 1 && provs[0].id === "cliffyhill",
  `1 provider và là cliffyhill (thấy: ${provs?.map((p) => p.id).join(", ") || "không có"})`);

const { data: prods } = await db
  .from("products").select("id, price, par, provider_id").eq("building_id", BUILDING);
check(prods?.length === 35, `35 sản phẩm (thấy ${prods?.length ?? 0})`);
check((prods ?? []).every((p) => p.provider_id === "cliffyhill"), "mọi sản phẩm trỏ về cliffyhill");
const demo = (prods ?? []).filter((p) => /^p\d+$/.test(p.id));
check(demo.length === 0, `không còn sản phẩm demo p1-p12 (thấy ${demo.length})`);

const { data: lvls } = await db
  .from("stock_levels").select("product_id, qty_now").eq("building_id", BUILDING);
const byId = new Map((lvls ?? []).map((l) => [l.product_id, l.qty_now]));
const missing = (prods ?? []).filter((p) => !byId.has(p.id));
check(missing.length === 0, `mọi sản phẩm có dòng stock_levels (thiếu ${missing.length})`);
const negative = (lvls ?? []).filter((l) => l.qty_now < 0);
check(negative.length === 0, `không có tồn kho âm (thấy ${negative.length})`);

for (const [id, want] of Object.entries(SPOT)) {
  const row = (prods ?? []).find((p) => p.id === id);
  const qty = byId.get(id);
  check(
    row !== undefined && Number(row.price) === want.price && qty === want.qty,
    `${id}: giá ${want.price} / tồn ${want.qty} (thấy giá ${row?.price ?? "—"} / tồn ${qty ?? "—"})`,
  );
}

const priced = UNPRICED.filter((id) => {
  const row = (prods ?? []).find((p) => p.id === id);
  return row && Number(row.price) !== 0;
});
check(priced.length === 0,
  `${UNPRICED.length} sản phẩm chưa có giá vẫn để 0.00, không ai đoán hộ (thấy ${priced.length} đã có giá)`);

const totalQty = (lvls ?? []).reduce((a, l) => a + l.qty_now, 0);
const belowPar = (prods ?? []).filter((p) => (byId.get(p.id) ?? 0) < p.par).length;
console.log(`\nTổng tồn: ${totalQty} đơn vị · ${belowPar}/${prods?.length ?? 0} sản phẩm dưới par (par là số suy ra, chưa phải số của nhà)`);
console.log(failed ? "CÓ KIỂM TRA THẤT BẠI" : "TẤT CẢ ĐỀU PASS");
process.exit(failed ? 1 : 0);
