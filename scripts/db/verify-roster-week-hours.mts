/**
 * Checks the roster's new weekly-hours column against real assignments.
 *
 * The column is computed client-side from the grid (so it tracks unsaved
 * edits), while the Payroll tab reads the same figures server-side via
 * getPayrollHours. Two paths to one number is exactly where they drift, so:
 *
 *   1. shift templates actually carry paid_hours - a column of zeroes would
 *      look like "nobody worked" rather than "nobody configured this".
 *   2. the grid-derived total per staffer equals the payroll-style total.
 *   3. the week grand total equals the sum of the per-staff figures.
 *   4. shifts whose template has no paid_hours are reported, since they make
 *      the hours figure an undercount of the shift count.
 *
 * Read-only. Run: npx tsx scripts/db/verify-roster-week-hours.mts [YYYY-MM-DD]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { staffWeekHours, formatHours } from "../../src/lib/mock-data/roster-schedule";
import { rosterCellKey } from "../../src/types/domain";
import type { RosterDay, RosterGrid } from "../../src/types/domain";

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

// Pick the week with the most assignments unless one is passed in, so the
// check runs against populated data rather than an empty future week.
const argWeek = process.argv[2];
const { data: allShifts } = await db
  .from("roster_shifts").select("staff_id,shift_date,shift_id").eq("building_id", "wesley");

function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() + (dow === 0 ? -6 : 1 - dow));
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

const perWeek = new Map<string, number>();
for (const r of allShifts ?? []) {
  const w = mondayOf(r.shift_date);
  perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
}
const weekStart = argWeek ?? [...perWeek].sort((a, b) => b[1] - a[1])[0]?.[0];
if (!weekStart) {
  console.log("Không có ca nào trong roster - bỏ qua.");
  process.exit(0);
}

const days: RosterDay[] = Array.from({ length: 7 }, (_, i) => {
  const [y, m, d] = weekStart.split("-").map(Number);
  const dt = new Date(y, m - 1, d + i);
  const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  return { dow: "", date: String(dt.getDate()), month: "", iso };
});
const weekEnd = days[6].iso;

const { data: templates } = await db.from("shift_templates").select("id,name,paid_hours");
const paid = new Map((templates ?? []).map((t) => [t.id, t.paid_hours != null ? Number(t.paid_hours) : 0]));
const paidHoursOf = (id: string) => paid.get(id) ?? 0;

const withHours = (templates ?? []).filter((t) => Number(t.paid_hours ?? 0) > 0);
console.log(`Tuần ${weekStart} → ${weekEnd}`);
console.log(`${templates?.length ?? 0} mẫu ca, ${withHours.length} mẫu có paid_hours > 0\n`);
check(withHours.length > 0,
  `mẫu ca có giờ công thật (nếu 0 thì cả cột sẽ hiện 0 và vô nghĩa)`);

const weekShifts = (allShifts ?? []).filter((r) => r.shift_date >= weekStart && r.shift_date <= weekEnd);
const grid: RosterGrid = {};
for (const r of weekShifts) {
  const k = rosterCellKey(r.staff_id, r.shift_date);
  (grid[k] ??= []).push(r.shift_id);
}
const staffIds = [...new Set(weekShifts.map((r) => r.staff_id))];
check(staffIds.length > 0, `${staffIds.length} nhân viên có ca trong tuần này (${weekShifts.length} ca)`);

// 2. grid-derived vs payroll-style aggregation, per staffer.
const payroll: Record<string, { hours: number; shifts: number }> = {};
for (const r of weekShifts) {
  const b = (payroll[r.staff_id] ??= { hours: 0, shifts: 0 });
  b.hours += paidHoursOf(r.shift_id);
  b.shifts += 1;
}
let mismatch = "";
let gridTotal = 0;
for (const id of staffIds) {
  const fromGrid = staffWeekHours(id, days, grid, paidHoursOf);
  gridTotal += fromGrid.hours;
  const want = payroll[id];
  if (fromGrid.hours !== want.hours || fromGrid.shifts !== want.shifts) {
    mismatch += ` ${id.slice(0, 8)}(lưới ${fromGrid.hours}h/${fromGrid.shifts} ≠ payroll ${want.hours}h/${want.shifts})`;
  }
}
check(mismatch === "", `giờ tính từ lưới khớp cách tính của Payroll cho cả ${staffIds.length} người${mismatch}`);

// 3. grand total.
const payrollTotal = Object.values(payroll).reduce((a, b) => a + b.hours, 0);
check(gridTotal === payrollTotal,
  `tổng tuần khớp: ${formatHours(gridTotal)} = ${formatHours(payrollTotal)} giờ`);

// 4. templates in use that carry no paid hours.
const usedNoHours = new Set(weekShifts.filter((r) => paidHoursOf(r.shift_id) === 0).map((r) => r.shift_id));
if (usedNoHours.size > 0) {
  const names = (templates ?? []).filter((t) => usedNoHours.has(t.id)).map((t) => t.name);
  console.log(`\n⚠ ${usedNoHours.size} mẫu ca ĐANG DÙNG nhưng paid_hours = 0: ${names.join(", ")}`);
  console.log("  → giờ công của những ca này đếm là 0, cột Hours sẽ thấp hơn thực tế.");
} else {
  console.log("\nMọi mẫu ca đang dùng đều có paid_hours.");
}

const top = staffIds
  .map((id) => ({ id, ...staffWeekHours(id, days, grid, paidHoursOf) }))
  .sort((a, b) => b.hours - a.hours).slice(0, 5);
const { data: names } = await db.from("staff").select("id,name").in("id", top.map((t) => t.id));
const nameOf = new Map((names ?? []).map((n) => [n.id, n.name]));
console.log("\n5 người nhiều giờ nhất:");
for (const t of top) console.log(`  ${formatHours(t.hours).padStart(5)}h  ${t.shifts} ca  ${nameOf.get(t.id) ?? t.id}`);

console.log(failed ? "\nCÓ KIỂM TRA THẤT BẠI" : "\nTẤT CẢ ĐỀU PASS");
process.exit(failed ? 1 : 0);
