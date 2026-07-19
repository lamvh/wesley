/**
 * Verifies the anon-callable today_on_duty rpc exists and returns the right
 * row shape. Run: npx tsx scripts/db/verify-today-on-duty-rpc.mts
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

const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await anon.rpc("today_on_duty");
  if (error) throw new Error(`FAIL: anon cannot call today_on_duty: ${error.message}`);
  if (!Array.isArray(data)) throw new Error("FAIL: expected array");
  if (data[0]) {
    for (const k of ["building_id", "role", "staff_name", "shift_time"]) {
      if (!(k in data[0])) throw new Error(`FAIL: missing column ${k}`);
    }
  }
  console.log(`✓ PASS - anon today_on_duty returned ${data.length} row(s)`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
