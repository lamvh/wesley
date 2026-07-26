/**
 * Verifies migration 0025_staff_leave_balances.sql once it has been applied:
 *
 *   1. `staff.sick` / `staff.sick_taken` exist.
 *   2. approve_leave debits the counter matching the request TYPE - sick leave
 *      must not eat the annual allowance (the bug 0025 fixes).
 *   3. 'Shift swap' consumes neither counter.
 *   4. Approving twice cannot double-charge.
 *   5. New staff default to 0 entitlement, not the old hard-coded 20.
 *
 * Operates on a throwaway staff row it creates and deletes, so no real record is
 * touched. Leave requests cascade-delete with the staff row.
 *
 * Run: npx tsx scripts/db/verify-staff-leave-balances.mts
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

const BUILDING = "wesley";
const MARKER = "ZZ Verify Leave Balances";

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

async function cleanup() {
  await db.from("staff").delete().eq("name", MARKER);
}
await cleanup();

// ── 1. columns exist ──
{
  const { error } = await db.from("staff").select("id,sick,sick_taken").limit(1);
  if (error) {
    console.error(`✗ staff.sick / staff.sick_taken chưa có - hãy apply supabase/migrations/0025_staff_leave_balances.sql trước.\n  ${error.message}`);
    process.exit(1);
  }
  check(true, "staff.sick + staff.sick_taken tồn tại");
}

// ── 5. a new row with no entitlement given defaults to 0 ──
const { data: created, error: insErr } = await db
  .from("staff")
  .insert({ building_id: BUILDING, name: MARKER, role: "Carer", roles: ["Carer"], initials: "ZZ" })
  .select("id,annual,taken,sick,sick_taken")
  .single();
if (insErr || !created) {
  console.error("✗ không tạo được staff tạm:", insErr?.message);
  process.exit(1);
}
const staffId = created.id;
check(
  created.annual === 0 && created.sick === 0 && created.taken === 0 && created.sick_taken === 0,
  `staff mới mặc định 0 hết (annual=${created.annual} sick=${created.sick} taken=${created.taken} sick_taken=${created.sick_taken})`,
);

// Give them an allowance to spend.
await db.from("staff").update({ annual: 20, sick: 10 }).eq("id", staffId);

const balances = async () => {
  const { data } = await db.from("staff").select("taken,sick_taken").eq("id", staffId).single();
  return { taken: data?.taken ?? -1, sick: data?.sick_taken ?? -1 };
};

async function request(type: string, days: number) {
  const { data, error } = await db
    .from("leave_requests")
    .insert({
      building_id: BUILDING, staff_id: staffId, type, days,
      from_date: "2099-03-01", to_date: "2099-03-01", status: "Pending",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`insert ${type} failed: ${error?.message}`);
  return data.id as string;
}

// ── 2a. annual leave debits `taken` only ──
{
  const before = await balances();
  const { error } = await db.rpc("approve_leave", { p_id: await request("Annual leave", 3) });
  if (error) { console.error("✗ approve_leave lỗi:", error.message); await cleanup(); process.exit(1); }
  const after = await balances();
  check(
    after.taken === before.taken + 3 && after.sick === before.sick,
    `Annual leave 3 ngày → taken ${before.taken}→${after.taken}, sick_taken ${before.sick}→${after.sick} (kỳ vọng +3 / +0)`,
  );
}

// ── 2b. sick leave debits `sick_taken` only - the bug 0025 fixes ──
{
  const before = await balances();
  await db.rpc("approve_leave", { p_id: await request("Sick leave", 2) });
  const after = await balances();
  check(
    after.sick === before.sick + 2 && after.taken === before.taken,
    `Sick leave 2 ngày → sick_taken ${before.sick}→${after.sick}, taken ${before.taken}→${after.taken} (kỳ vọng +2 / +0, KHÔNG trừ vào annual)`,
  );
}

// ── 3. shift swap consumes nothing ──
{
  const before = await balances();
  await db.rpc("approve_leave", { p_id: await request("Shift swap", 1) });
  const after = await balances();
  check(
    after.taken === before.taken && after.sick === before.sick,
    `Shift swap → không trừ quỹ nào (taken ${after.taken}, sick_taken ${after.sick})`,
  );
}

// ── 4. approving the same request twice cannot double-charge ──
{
  const id = await request("Sick leave", 4);
  await db.rpc("approve_leave", { p_id: id });
  const once = await balances();
  await db.rpc("approve_leave", { p_id: id });
  const twice = await balances();
  check(
    twice.sick === once.sick && twice.taken === once.taken,
    `duyệt lại lần 2 không cộng thêm (sick_taken ${once.sick} → ${twice.sick})`,
  );
}

await cleanup();
{
  const { count } = await db.from("staff").select("*", { count: "exact", head: true }).eq("name", MARKER);
  check(count === 0, `dọn sạch staff tạm (còn ${count} dòng)`);
}

console.log(failed ? "\n✗ FAIL" : "\n✓ PASS - approve_leave trừ đúng quỹ theo loại nghỉ");
process.exit(failed ? 1 : 0);
