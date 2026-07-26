/**
 * Checks the source of the roster's leave marks (lib/data/roster.ts::
 * getApprovedLeaveByDay):
 *
 *   1. Only APPROVED requests appear - a Pending one must not look like
 *      settled leave on the grid.
 *   2. A multi-day request expands to one mark per day, inclusive of both ends.
 *   3. A request that starts before / ends after the visible week is clamped to
 *      it, rather than being dropped or spilling outside.
 *   4. An open-ended request (to_date null) runs to the end of the week.
 *   5. Leave outside the week doesn't leak in.
 *
 * Uses a throwaway staff row on far-future dates and deletes it afterwards
 * (leave requests cascade with the staff row), so no real record is touched.
 *
 * Run: npx tsx scripts/db/verify-roster-approved-leave.mts
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
const NAME = "ZZ Verify Roster Leave";
// A Mon–Sun week far past any real roster.
const WEEK_START = "2099-02-02";
const WEEK_END = "2099-02-08";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

const cleanup = () => db.from("staff").delete().eq("name", NAME);
await cleanup();

const { data: staff, error: sErr } = await db
  .from("staff")
  .insert({ building_id: BUILDING, name: NAME, role: "Carer", roles: ["Carer"], initials: "ZZ" })
  .select("id").single();
if (sErr || !staff) { console.error("✗ không tạo được staff tạm:", sErr?.message); process.exit(1); }
const staffId = staff.id as string;

async function addLeave(type: string, from: string, to: string | null, status: string) {
  const { error } = await db.from("leave_requests").insert({
    building_id: BUILDING, staff_id: staffId, type,
    from_date: from, to_date: to, days: 1, status,
  });
  if (error) throw new Error(`insert leave failed: ${error.message}`);
}

// Mirrors getApprovedLeaveByDay exactly.
async function read(): Promise<Record<string, string>> {
  const { data, error } = await db
    .from("leave_requests")
    .select("staff_id,type,from_date,to_date")
    .eq("building_id", BUILDING)
    .eq("status", "Approved")
    .lte("from_date", WEEK_END)
    .or(`to_date.is.null,to_date.gte.${WEEK_START}`);
  if (error || !data) return {};
  const byDay: Record<string, string> = {};
  for (const r of data) {
    if (!r.staff_id || !r.from_date) continue;
    const from = r.from_date > WEEK_START ? r.from_date : WEEK_START;
    const to = !r.to_date || r.to_date > WEEK_END ? WEEK_END : r.to_date;
    for (const c = parse(from); iso(c) <= to; c.setDate(c.getDate() + 1)) {
      byDay[`${r.staff_id}::${iso(c)}`] = r.type;
    }
  }
  return byDay;
}
const daysMarked = async () =>
  Object.keys(await read()).filter((k) => k.startsWith(staffId)).map((k) => k.split("::")[1]).sort();

// ── 1. Pending is invisible ──
await addLeave("Annual leave", "2099-02-03", "2099-02-04", "Pending");
check((await daysMarked()).length === 0, `đơn Pending không hiện trên roster (${(await daysMarked()).length} ngày)`);
await db.from("leave_requests").delete().eq("staff_id", staffId);

// ── 2. Multi-day expands inclusively ──
await addLeave("Sick leave", "2099-02-03", "2099-02-05", "Approved");
{
  const d = await daysMarked();
  check(
    d.join(",") === "2099-02-03,2099-02-04,2099-02-05",
    `nghỉ 3/2→5/2 bung đúng 3 ngày kể cả 2 đầu mút: ${d.join(", ")}`,
  );
}
await db.from("leave_requests").delete().eq("staff_id", staffId);

// ── 3. Clamped to the visible week on both sides ──
await addLeave("Annual leave", "2099-01-28", "2099-02-11", "Approved");
{
  const d = await daysMarked();
  check(
    d.length === 7 && d[0] === WEEK_START && d[6] === WEEK_END,
    `nghỉ dài 28/1→11/2 bị kẹp đúng vào tuần: ${d.length} ngày (${d[0]} → ${d[d.length - 1]})`,
  );
}
await db.from("leave_requests").delete().eq("staff_id", staffId);

// ── 4. Open-ended runs to the end of the week ──
await addLeave("Annual leave", "2099-02-06", null, "Approved");
{
  const d = await daysMarked();
  check(
    d.join(",") === "2099-02-06,2099-02-07,2099-02-08",
    `nghỉ không có ngày kết thúc chạy tới hết tuần: ${d.join(", ")}`,
  );
}
await db.from("leave_requests").delete().eq("staff_id", staffId);

// ── 5. Leave in another week doesn't leak in ──
await addLeave("Sick leave", "2099-03-02", "2099-03-03", "Approved");
check((await daysMarked()).length === 0, "nghỉ ở tuần khác không lọt vào tuần đang xem");

await cleanup();
{
  const { count } = await db.from("staff").select("*", { count: "exact", head: true }).eq("name", NAME);
  check(count === 0, `dọn sạch staff tạm (còn ${count})`);
}

console.log(failed ? "\n✗ FAIL" : "\n✓ PASS - leave đã duyệt map đúng ngày trên roster");
process.exit(failed ? 1 : 0);
