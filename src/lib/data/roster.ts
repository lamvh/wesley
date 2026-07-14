import { createClient } from "@/lib/supabase/server";
import { rosterCellKey, type RosterGrid } from "@/types/domain";

const BUILDING = "wesley";

// Load all persisted shift assignments whose date falls in [weekStartISO,
// weekEndISO] and fold them into the grid keyed by staffId::date.
export async function getRosterAssignments(
  weekStartISO: string,
  weekEndISO: string,
): Promise<RosterGrid> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roster_shifts")
    .select("staff_id,shift_date,shift_id")
    .eq("building_id", BUILDING)
    .gte("shift_date", weekStartISO)
    .lte("shift_date", weekEndISO);
  if (error) throw new Error(`Failed to load roster: ${error.message}`);

  const grid: RosterGrid = {};
  for (const r of data ?? []) {
    const key = rosterCellKey(r.staff_id, r.shift_date);
    (grid[key] ??= []).push(r.shift_id);
  }
  return grid;
}
