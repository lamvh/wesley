/**
 * Checks the "Thường làm" suggestion source (lib/data/roster.ts::
 * getShiftUsageByStaff) against the live roster history:
 *
 *   1. The window is the 8 weeks BEFORE the displayed week, and the displayed
 *      week itself is excluded - otherwise a shift just assigned by hand would
 *      promote itself into that staffer's "usual" list.
 *   2. Counts are ordered most-assigned first, ties broken stably.
 *   3. The result is actually useful on today's data (some staff get a ranked
 *      list rather than every shift tying at 1).
 *
 * Read-only - writes nothing.
 *
 * Run: npx tsx scripts/db/verify-shift-usage-suggestions.mts [weekStartISO]
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
const USAGE_WEEKS = 8;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const weekStartOf = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + (x.getDay() === 0 ? -6 : 1 - x.getDay()));
  return x;
};

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

// Pick the newest week that actually has data, so the check is meaningful
// regardless of when it is run.
const { data: latest } = await db
  .from("roster_shifts").select("shift_date").eq("building_id", BUILDING)
  .order("shift_date", { ascending: false }).limit(1);
const weekStartISO = process.argv[2] ?? iso(weekStartOf(parse(latest?.[0]?.shift_date ?? iso(new Date()))));

const fromISO = addDays(weekStartISO, -USAGE_WEEKS * 7);
const toISO = addDays(weekStartISO, -1);
console.log(`Tuần đang xem : ${weekStartISO}`);
console.log(`Cửa sổ tính   : ${fromISO} → ${toISO}\n`);

check(toISO < weekStartISO, `cửa sổ kết thúc (${toISO}) trước tuần đang xem (${weekStartISO})`);

const { data: rows, error } = await db
  .from("roster_shifts").select("staff_id,shift_id,shift_date")
  .eq("building_id", BUILDING).gte("shift_date", fromISO).lte("shift_date", toISO);
if (error) { console.error("✗", error.message); process.exit(1); }

check(
  !(rows ?? []).some((r) => r.shift_date >= weekStartISO),
  `không dòng nào lọt từ tuần đang xem (${rows?.length} dòng trong cửa sổ)`,
);

// Same fold the reader does.
const counts = new Map<string, Map<string, number>>();
for (const r of rows ?? []) {
  let per = counts.get(r.staff_id);
  if (!per) counts.set(r.staff_id, (per = new Map()));
  per.set(r.shift_id, (per.get(r.shift_id) ?? 0) + 1);
}
const usage = new Map(
  [...counts].map(([s, per]) => [
    s,
    [...per].map(([shiftId, count]) => ({ shiftId, count }))
      .sort((a, b) => b.count - a.count || a.shiftId.localeCompare(b.shiftId)),
  ]),
);

check(
  [...usage.values()].every((l) => l.every((u, i) => i === 0 || l[i - 1].count >= u.count)),
  "mọi danh sách sắp xếp giảm dần theo số lần",
);

const ranked = [...usage.values()].filter((l) => l[0].count >= 2).length;
check(
  ranked > 0,
  `${ranked}/${usage.size} staff có ít nhất 1 ca lặp ≥2 lần (gợi ý xếp hạng được, không phải tất cả hoà 1)`,
);

// Show a few real examples with names, so the output can be eyeballed.
const [{ data: staff }, { data: tpl }] = await Promise.all([
  db.from("staff").select("id,name"),
  db.from("shift_templates").select("id,name,time_label"),
]);
const staffName = new Map((staff ?? []).map((s) => [s.id, s.name]));
const shiftName = new Map((tpl ?? []).map((t) => [t.id, `${t.name} · ${t.time_label}`]));

const sample = [...usage.entries()]
  .sort((a, b) => b[1][0].count - a[1][0].count)
  .slice(0, 5);
console.log("\nVí dụ gợi ý (top 4 mỗi người, như picker sẽ hiện):");
for (const [sid, list] of sample) {
  console.log(`  ${staffName.get(sid) ?? sid}`);
  for (const u of list.slice(0, 4)) {
    console.log(`      ×${u.count}  ${shiftName.get(u.shiftId) ?? u.shiftId}`);
  }
}

console.log(failed ? "\n✗ FAIL" : "\n✓ PASS");
process.exit(failed ? 1 : 0);
