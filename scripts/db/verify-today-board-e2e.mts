/**
 * End-to-end check of the today board data path against the real DB: seed one
 * staff + a roster_shift dated today (Auckland), then confirm the anon rpc
 * returns that person. Cleans up after itself.
 * Run: npx tsx scripts/db/verify-today-board-e2e.mts
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
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const NAME = "Verify Today Staff";

async function cleanup() {
  const prev = await admin.from("staff").select("id").eq("name", NAME);
  for (const s of prev.data ?? []) {
    await admin.from("roster_shifts").delete().eq("staff_id", s.id);
    await admin.from("staff").delete().eq("id", s.id);
  }
}

async function main() {
  await cleanup();
  const nz = new Date(new Date().toLocaleString("en-US", { timeZone: "Pacific/Auckland" }));
  const iso = `${nz.getFullYear()}-${String(nz.getMonth() + 1).padStart(2, "0")}-${String(nz.getDate()).padStart(2, "0")}`;

  const st = await admin.from("staff")
    .insert({ name: NAME, role: "RN", building_id: "wesley", status: "Active" })
    .select("id").single();
  if (st.error) throw st.error;
  const staffId = st.data.id;

  const tpl = await admin.from("shift_templates").select("id").limit(1).maybeSingle();
  await admin.from("roster_shifts").insert({
    staff_id: staffId, building_id: "wesley", shift_date: iso, shift_id: tpl.data?.id ?? "m",
  });

  const { data, error } = await anon.rpc("today_on_duty");
  const hit = !error && (data ?? []).some((r: { staff_name: string }) => r.staff_name === NAME);
  await cleanup();
  if (error) throw new Error(`FAIL: ${error.message}`);
  if (!hit) throw new Error("FAIL: seeded today shift not returned by rpc");
  console.log("✓ PASS - today_on_duty returns today's seeded shift to anon");
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
