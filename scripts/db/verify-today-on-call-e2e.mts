/**
 * End-to-end check of the today on-call data path against the real DB: seed
 * one staff + a roster_on_call row dated today (Auckland), then confirm the
 * anon rpc returns that person. Cleans up after itself.
 * Run: npx tsx scripts/db/verify-today-on-call-e2e.mts
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

const NAME = "Verify Today OnCall";

async function cleanup() {
  const prev = await admin.from("staff").select("id").eq("name", NAME);
  for (const s of prev.data ?? []) {
    await admin.from("roster_on_call").delete().eq("staff_id", s.id);
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

  await admin.from("roster_on_call").upsert(
    { building_id: "wesley", on_call_date: iso, staff_id: staffId },
    { onConflict: "building_id,on_call_date" },
  );

  const { data, error } = await anon.rpc("today_on_call");
  const hit = !error && (data ?? []).some((r: { staff_name: string }) => r.staff_name === NAME);
  await admin.from("roster_on_call").delete().eq("staff_id", staffId);
  await cleanup();
  if (error) throw new Error(`FAIL: ${error.message}`);
  if (!hit) throw new Error("FAIL: seeded today on-call not returned by rpc");
  console.log("✓ PASS - today_on_call returns today's seeded on-call staff to anon");
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
