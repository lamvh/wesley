/**
 * Proves the DB behaviour that "copy last week" (lib/actions/roster.ts::
 * copyPreviousWeek) is built on:
 *
 *   1. upsert(..., { onConflict: "staff_id,shift_date,shift_id",
 *                    ignoreDuplicates: true }).select()
 *      returns ONLY the rows actually inserted - that list is what the client
 *      merges into its grid, so if it over-reported, the grid would show shifts
 *      that were already there twice.
 *   2. Running it twice adds nothing the second time (idempotent).
 *   3. Shifts the target week already has are left untouched (merge, not
 *      overwrite).
 *
 * Works on throwaway dates far in the future so it never disturbs real roster
 * data, and cleans up after itself.
 *
 * Run: npx tsx scripts/db/verify-roster-copy-week.mts
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
// Mondays well past any real roster.
const PREV_WEEK = "2099-01-05";
const THIS_WEEK = "2099-01-12";

const plusWeek = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + 7);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

async function cleanup() {
  await db.from("roster_shifts").delete().in("shift_date", [
    PREV_WEEK, plusWeek(PREV_WEEK),
    "2099-01-06", "2099-01-13",
  ]);
}

// The exact query copyPreviousWeek runs, minus the Next.js plumbing.
async function copy(staffId?: string) {
  let q = db
    .from("roster_shifts")
    .select("staff_id, shift_date, shift_id")
    .eq("building_id", BUILDING)
    .gte("shift_date", PREV_WEEK)
    .lte("shift_date", "2099-01-11");
  if (staffId) q = q.eq("staff_id", staffId);

  const { data: source, error } = await q;
  if (error) throw new Error(`read failed: ${error.message}`);
  if (!source?.length) return [];

  const rows = source.map((r) => ({
    building_id: BUILDING,
    staff_id: r.staff_id,
    shift_date: plusWeek(r.shift_date),
    shift_id: r.shift_id,
  }));

  const { data: inserted, error: wErr } = await db
    .from("roster_shifts")
    .upsert(rows, { onConflict: "staff_id,shift_date,shift_id", ignoreDuplicates: true })
    .select("staff_id, shift_date, shift_id");
  if (wErr) throw new Error(`write failed: ${wErr.message}`);
  return inserted ?? [];
}

await cleanup();

const { data: staff } = await db.from("staff").select("id,name").limit(2);
const { data: shifts } = await db.from("shift_templates").select("id,name").limit(2);
if (!staff || staff.length < 1 || !shifts || shifts.length < 2) {
  console.error("✗ need at least 1 staff and 2 shift templates seeded");
  process.exit(1);
}
const [alice] = staff;
const [shiftA, shiftB] = shifts;

// ── seed last week: Alice works shiftA on the Monday ──
await db.from("roster_shifts").insert({
  building_id: BUILDING, staff_id: alice.id, shift_date: PREV_WEEK, shift_id: shiftA.id,
});

// ── 1. first copy inserts exactly that one shift, on the same weekday +7d ──
const first = await copy();
check(first.length === 1, `first copy reported ${first.length} row(s), expected 1`);
check(
  first[0]?.shift_date === THIS_WEEK && first[0]?.shift_id === shiftA.id,
  `landed on ${first[0]?.shift_date} / ${first[0]?.shift_id} (expected ${THIS_WEEK} / ${shiftA.id})`,
);

// ── 2. second copy is a no-op ──
const second = await copy();
check(second.length === 0, `second copy reported ${second.length} row(s), expected 0 (idempotent)`);

// ── 3. a shift the target week already had is preserved, not replaced ──
await db.from("roster_shifts").insert({
  building_id: BUILDING, staff_id: alice.id, shift_date: THIS_WEEK, shift_id: shiftB.id,
});
const third = await copy();
check(third.length === 0, `copy over a hand-edited week added ${third.length} row(s), expected 0`);

const { data: finalRows } = await db
  .from("roster_shifts")
  .select("shift_id")
  .eq("staff_id", alice.id)
  .eq("shift_date", THIS_WEEK);
const ids = (finalRows ?? []).map((r) => r.shift_id).sort();
check(
  ids.length === 2 && ids.includes(shiftA.id) && ids.includes(shiftB.id),
  `target cell holds [${ids.join(", ")}], expected both the copied and the hand-added shift`,
);

await cleanup();
console.log(failed ? "\n✗ FAIL" : "\n✓ PASS - merge semantics hold");
process.exit(failed ? 1 : 0);
