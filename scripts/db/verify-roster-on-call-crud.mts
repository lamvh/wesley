/**
 * Simulates setOnCallDay/clearOnCallDay mechanics against the real DB: upsert
 * sets the on-call staffer for a date, a second upsert replaces it (unique
 * building_id+on_call_date), clear removes the row. Cleans up after itself.
 * Run: npx tsx scripts/db/verify-roster-on-call-crud.mts
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
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const DATE = "2099-01-01"; // far future, never collides with real data
const NAME_A = "Verify OnCall A";
const NAME_B = "Verify OnCall B";

async function cleanup() {
  await admin.from("roster_on_call").delete().eq("on_call_date", DATE);
  await admin.from("staff").delete().in("name", [NAME_A, NAME_B]);
}

async function main() {
  await cleanup();
  const a = await admin.from("staff").insert({ name: NAME_A, role: "RN", building_id: "wesley", status: "Active" }).select("id").single();
  const b = await admin.from("staff").insert({ name: NAME_B, role: "RN", building_id: "wesley", status: "Active" }).select("id").single();
  const staffIdA = a.data!.id;
  const staffIdB = b.data!.id;

  // set
  await admin.from("roster_on_call")
    .upsert({ building_id: "wesley", on_call_date: DATE, staff_id: staffIdA }, { onConflict: "building_id,on_call_date" });
  const after1 = await admin.from("roster_on_call").select("staff_id").eq("on_call_date", DATE).maybeSingle();
  if (after1.data?.staff_id !== staffIdA) throw new Error("FAIL: initial on-call not persisted");

  // replace (unique building_id+on_call_date)
  await admin.from("roster_on_call")
    .upsert({ building_id: "wesley", on_call_date: DATE, staff_id: staffIdB }, { onConflict: "building_id,on_call_date" });
  const after2 = await admin.from("roster_on_call").select("staff_id").eq("on_call_date", DATE).maybeSingle();
  if (after2.data?.staff_id !== staffIdB) throw new Error("FAIL: on-call replace not persisted");

  // clear
  await admin.from("roster_on_call").delete().eq("building_id", "wesley").eq("on_call_date", DATE);
  const after3 = await admin.from("roster_on_call").select("staff_id").eq("on_call_date", DATE).maybeSingle();
  if (after3.data) throw new Error("FAIL: clear did not remove the row");

  console.log("✓ PASS - on-call set, replace, and clear persist correctly");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
