/**
 * Verifies the Stock + Staff seed landed, via the Supabase REST API (service-role,
 * bypasses RLS) — works even where the direct Postgres port is unreachable (IPv6).
 * Run: npx tsx scripts/db/verify-rest.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => readFileSync(join(root, ".env.local"), "utf8").split("\n")
  .find((l) => l.trim().startsWith(`${k}=`))?.slice(k.length + 1).trim().replace(/^["']|["']$/g, "");

async function main() {
  const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const tables = ["providers", "products", "stock_levels", "stock_movements", "shift_templates", "leave_requests"];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(error ? `✗ ${t}: ${error.message}` : `✓ ${t}: ${count} rows`);
  }
  // staff extended columns
  const { data: staff, error: se } = await sb.from("staff").select("name,contract,hours,annual,taken").limit(3);
  if (se) console.log(`✗ staff extended cols: ${se.message}`);
  else console.log("✓ staff sample:", JSON.stringify(staff));
  // a stock movement + a leave request sample
  const { data: mv } = await sb.from("stock_movements").select("product_id,direction,qty,after_qty").limit(1);
  console.log("✓ movement sample:", JSON.stringify(mv));
  const { data: lv } = await sb.from("leave_requests").select("type,status,days").limit(2);
  console.log("✓ leave sample:", JSON.stringify(lv));
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
