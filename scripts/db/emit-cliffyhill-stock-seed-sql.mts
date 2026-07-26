/**
 * Emits paste-ready SQL for the CliffyHill supply catalogue, and REPORTS every
 * row it had to repair or drop rather than quietly writing a guess.
 *
 * Source is the stocktake sheet supplied by the home: supplier code, product
 * description, unit price (excl GST), price incl GST, and qty on hand. Prices
 * are stored excl GST because orders.total_excl_gst is the ordering total.
 *
 * Par levels are NOT in the source. They are derived (qty rounded down to the
 * nearest 5, floor 5) purely so the low-stock/reorder UI has something to work
 * against - treat every par below as provisional until the home confirms it.
 *
 * Checks: GST arithmetic (incl = excl x 1.15), unique ids, qty is a
 * non-negative integer, every row has a name.
 *
 * Run: npx tsx scripts/db/emit-cliffyhill-stock-seed-sql.mts
 * Output: supabase/seed/0009_cliffyhill_stock.sql
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const BUILDING = "wesley";
const PROVIDER = "cliffyhill";
const GST = 1.15;

// Transcribed from the stocktake sheet. Blank cells stay blank - nothing is
// invented here; repairs happen below and are reported.
//
// sheetRow | vnLabel | code | name | category | unit | priceExcl | priceIncl | qty
const RAW = `
1|nuoc ve sinh|GRB2-5|GREEN RHINO Toilet Disinfectant Cleaner 5L|Housekeeping|bottle (5L)|26.80|30.82|0
2|nuoc rua bat may|GRK4-20|GREEN RHINO Auto Dishwasher Detergent 20L|Housekeeping|can (20L)|104.60|120.29|4
3|nuoc rua tay|GRS4-5|GREEN RHINO Enviro Foaming Hand Soap 5L|Housekeeping|bottle (5L)|26.88|30.91|3
4|sua tam|GRS6-5|GREEN RHINO Body & Hair Shampoo 5L|Housekeeping|bottle (5L)|26.80|30.82|5
5||GRS8F-5|GREEN RHINO Foaming Hand Sanitiser 5L|Clinical & PPE|bottle (5L)|26.80|30.82|2
6||Hipi|Cabernet Franc Malbec 2022|Kitchen & Nutrition|bottle|16.00|18.40|0
7|Bim quan M|IGC-0004|IngoCare Pullups - Size M|Continence|bag of 16|13.12|15.09|0
8|Bim quan L|IGC-0005|IngoCare Pullups - Size L|Continence|bag of 16|14.40|16.56|16
9|Bim quan XL|IGC-0006|IngoCare Pullups - Size XL|Continence|bag of 16|15.52|17.85|21
10|Bim dan M|IGC-0010|IngoCare Wraps/All-In-One Premium - Size M|Continence|bag of 12|13.20|15.18|6
11|Bim dan XL|IGC-0012|IngoCare Wraps/All-In-One Premium - Size XL|Continence|bag of 12|16.08|18.49|8
12|Mieng lot Ingo (L)|IGC-0013|IngoCare Insert Pad - Size L|Continence|bag of 16|9.50|10.93|0
13|Bang ve sinh||Sanitary pads|Continence||||0
14|Gang tay (S)|IGC-12350|Nitrile Sky Blue Gloves Size S|Clinical & PPE|carton of 10 packs|45.00|51.75|9
15|Gang tay (M)|IGC-12351|Nitrile Sky Blue Gloves Size M|Clinical & PPE|carton of 10 packs|45.00|51.75|51
16|Gang tay (XL)|IGC-12353|Nitrile Sky Blue Gloves Size XL|Clinical & PPE|carton of 10 packs|45.00|51.75|10
17|Giay de ban|IGS-0090|INGO Cube Box Tissue|Housekeeping|carton of 100 boxes|60.00|69.00|6
18|Giay cuon ve sinh be|IGS-0400|IngoSoft Luxury Wrapped Toilet Pack|Housekeeping|pack of 50 rolls|33.00|37.95|73
19|Giay lau tay|IGS-1200|IngoSoft Slimfold Paper Towels|Housekeeping|box of 20 bags|36.50|41.98|1
20|Giay ve sinh|IGS-1250|Matthews Interleave Toilet Tissue|Housekeeping|carton of 36 packs|33.87|38.95|182
21|Khan uot||Wet wipes|Continence||19.00|21.85|39
22|Tui rac trang 18L|MPH-2050|Recycled Bin Liner 18L|Housekeeping|bag of 35 rolls|82.00|94.30|5
23|Tui rac trang 36L|MPH-2070|Recycled Bin Liner 36L|Housekeeping|bag of 29 rolls|88.00|101.20|7
24|Tui rac den 80L|MPH-2360|Recycled Bin Liner 80L|Housekeeping|bag of 7 rolls|82.00|94.30|-2
25|Khau trang|MPH-30110|Medical Face Masks Type IIR|Clinical & PPE||50.00|57.50|119
26||MPH-34720|A4 Print Paper|Other|carton||32.50|0
27|Giay an tren D1|MPH-38430|Matthews Lunch Napkins 500 sheet|Kitchen & Nutrition|carton of 6 bags|32.00|36.80|18
31|Khau trang N95||N95 Mask|Clinical & PPE|box|||26
32|Tui rac den BSL - bep 2||BSL Rubbish Bag - Kitchen 2|Housekeeping||||-17
33|Tui rac den BSL - bep 1||BSL Rubbish Bag LGE Bin Liner - Kitchen 1|Housekeeping||||-10
34|||GreenR Enzyme All-Purpose Cleaner|Housekeeping|can|||2
35|||Bioclean Odour Neutraliser|Housekeeping|can|||0
36|||QualChem Saniclean Heavy Duty Cleaner Sanitiser|Housekeeping|can|||0
37|||Alcohol Sanitiser 4L 75%|Housekeeping|can|||0
38|Dung dich AP439 5L||AP439 Solution 5L|Housekeeping|can|||0
`.trim();

// Sheet rows carrying no product name at all - recorded so the count reconciles
// against the 39-row source rather than silently shrinking.
const DROPPED = [
  { row: 28, why: "entirely blank" },
  { row: 29, why: "blank - only qty 6 and units-in-pack 6, no name, code or price" },
  { row: 30, why: "blank - only units-in-pack 143, no name, code or price" },
  { row: 39, why: "entirely blank" },
];

const repairs: string[] = [];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

const q = (s: string | null) => (s === null || s === "" ? "null" : `'${s.replace(/'/g, "''")}'`);

/** Par is derived, not sourced: qty rounded down to the nearest 5, floor of 5. */
const derivePar = (qty: number) => Math.max(5, Math.floor(qty / 5) * 5);

type Row = {
  sheetRow: number; id: string; name: string; category: string;
  unit: string; price: number; qty: number; par: number;
};

const FIELDS = 9; // sheetRow, vnLabel, code, name, category, unit, priceExcl, priceIncl, qty

const rows: Row[] = RAW.split("\n").map((line) => {
  const cells = line.split("|");
  // A missing empty cell silently shifts price into qty, so arity is checked
  // before anything is read out of the row.
  if (cells.length !== FIELDS) {
    throw new Error(`"${line}": ${cells.length} cells, expected ${FIELDS}`);
  }
  const [sheetRowRaw, , code, name, category, unit, excl, incl, qtyRaw] = cells;
  const sheetRow = Number(sheetRowRaw);

  if (!name) throw new Error(`row ${sheetRow}: no product name - should have been dropped, not parsed`);

  const id = code ? slug(code) : slug(name);
  if (!code) repairs.push(`row ${sheetRow} "${name}": no supplier code on the sheet - id generated from the name ("${id}")`);

  // Price: prefer the excl-GST column. Fall back to deriving it from the
  // incl-GST column, which is what the sheet does everywhere else.
  let price = 0;
  if (excl) {
    price = Number(excl);
    if (incl) {
      const expected = Math.round(price * GST * 100) / 100;
      if (Math.abs(expected - Number(incl)) > 0.02) {
        repairs.push(`row ${sheetRow} "${name}": GST mismatch - ${excl} x 1.15 = ${expected}, sheet says ${incl}`);
      }
    }
  } else if (incl) {
    price = Math.round((Number(incl) / GST) * 100) / 100;
    repairs.push(`row ${sheetRow} "${name}": no excl-GST price - derived ${price} from the incl-GST price ${incl}`);
  } else {
    repairs.push(`row ${sheetRow} "${name}": no price on the sheet - stored as 0.00, needs pricing before it can be ordered`);
  }

  let qty = Number(qtyRaw);
  if (!Number.isFinite(qty)) {
    repairs.push(`row ${sheetRow} "${name}": qty cell is not a number ("${qtyRaw}") - stored as 0`);
    qty = 0;
  } else if (qty < 0) {
    repairs.push(`row ${sheetRow} "${name}": qty on hand is ${qty} - negative stock is not representable, stored as 0`);
    qty = 0;
  }

  return { sheetRow, id, name, category, unit, price, qty: Math.trunc(qty), par: derivePar(qty) };
});

// The sheet duplicated row 17's description, unit and price onto row 13, whose
// only trustworthy cell is the Vietnamese label. Flagged, not carried over.
repairs.push(
  `row 13 "Sanitary pads": description/unit/price were a copy of row 17 (INGO Cube Box Tissue) and the qty cell read "sanitary pads" - only the name is kept, everything else blank/0`,
);

const dupes = rows.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupes.length) throw new Error(`duplicate product ids: ${dupes.join(", ")}`);
if (rows.length + DROPPED.length !== 39) {
  throw new Error(`row count does not reconcile: ${rows.length} kept + ${DROPPED.length} dropped != 39`);
}

const sql = [
  `-- CliffyHill supply catalogue for ${BUILDING}, transcribed from the home's stocktake sheet.`,
  `-- Generated by scripts/db/emit-cliffyhill-stock-seed-sql.mts - do not edit by hand.`,
  `-- Replaces the demo catalogue seeded by 0002_stock_seed.sql.`,
  `-- Prices are EXCL GST (orders total on total_excl_gst). Par levels are DERIVED,`,
  `-- not supplied by the home - see the script header.`,
  ``,
  `-- Clear the demo catalogue for this building. Products cascade to stock_levels,`,
  `-- stock_movements and order_lines; orders/providers are cleared explicitly.`,
  `delete from public.order_lines where order_id in (select id from public.orders where building_id = '${BUILDING}');`,
  `delete from public.orders where building_id = '${BUILDING}';`,
  `delete from public.stock_movements where building_id = '${BUILDING}';`,
  `delete from public.products where building_id = '${BUILDING}';`,
  `delete from public.stock_levels where building_id = '${BUILDING}';`,
  `delete from public.providers where building_id = '${BUILDING}';`,
  ``,
  `insert into public.providers (id, building_id, name, category, contact_email, phone, lead_time, terms, preferred, color, tint) values`,
  `  ('${PROVIDER}','${BUILDING}','CliffyHill','Other',null,null,null,null,true,'#2C3563','#E4E6F2')`,
  `on conflict (id) do update set name = excluded.name, category = excluded.category, preferred = excluded.preferred,`,
  `  color = excluded.color, tint = excluded.tint;`,
  ``,
  `insert into public.products (id, building_id, name, category, unit, price, provider_id, par) values`,
  rows
    .map((r) => `  (${q(r.id)},'${BUILDING}',${q(r.name)},${q(r.category)},${q(r.unit)},${r.price.toFixed(2)},'${PROVIDER}',${r.par})`)
    .join(",\n"),
  `on conflict (id) do update set name = excluded.name, category = excluded.category, unit = excluded.unit,`,
  `  price = excluded.price, provider_id = excluded.provider_id, par = excluded.par;`,
  ``,
  `insert into public.stock_levels (product_id, building_id, qty_now) values`,
  rows.map((r) => `  (${q(r.id)},'${BUILDING}',${r.qty})`).join(",\n"),
  `on conflict (product_id, building_id) do update set qty_now = excluded.qty_now, updated_at = now();`,
  ``,
].join("\n");

mkdirSync(join(root, "supabase", "seed"), { recursive: true });
writeFileSync(join(root, "supabase", "seed", "0009_cliffyhill_stock.sql"), sql);

console.log(`Wrote supabase/seed/0009_cliffyhill_stock.sql - ${rows.length} products, 1 provider.`);
console.log(`\nDropped ${DROPPED.length} sheet rows (no product name):`);
for (const d of DROPPED) console.log(`  - row ${d.row}: ${d.why}`);
console.log(`\nRepaired/flagged ${repairs.length} rows:`);
for (const r of repairs) console.log(`  - ${r}`);
console.log(`\nPar levels for all ${rows.length} products are derived, not supplied. Confirm with the home.`);
