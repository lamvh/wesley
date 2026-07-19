import { createClient } from "@/lib/supabase/server";
import { getShiftTemplates } from "@/lib/data/staff";
import { rosterCellKey, type RosterGrid, type ShiftType } from "@/types/domain";

const BUILDING = "wesley";

// The roster legend/picker vocabulary, sourced from the real shift_templates
// (Staff → Shift templates) and mapped to the ShiftType view shape the grid,
// legend and cell picker consume. The template name doubles as both the short
// code chip and the descriptive label. All buildings' templates are offered so
// the picker can assign any shift (e.g. The Lodge) regardless of building.
//
// Each shift keeps its own template color (set via the admin's swatch picker
// in Staff → Shift templates), not a role-derived one: deriving from role
// collapsed same-role shifts (e.g. Carer's Morning vs Afternoon vs Night) into
// one indistinguishable color, losing per-shift distinction on the grid.
export async function getRosterShiftTypes(): Promise<ShiftType[]> {
  const templates = await getShiftTemplates();
  return templates.map((t) => ({
    id: t.id,
    code: t.name,
    label: t.name,
    time: t.time,
    color: t.color,
    tint: t.tint,
    border: t.border,
    role: t.role,
    building: t.building,
  }));
}

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

// Load the on-call assignment (nurse/HCA covering after hours) for each date in
// [weekStartISO, weekEndISO], keyed by date ISO -> staff id.
export async function getOnCallByDay(
  weekStartISO: string,
  weekEndISO: string,
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roster_on_call")
    .select("on_call_date,staff_id")
    .eq("building_id", BUILDING)
    .gte("on_call_date", weekStartISO)
    .lte("on_call_date", weekEndISO);
  if (error) throw new Error(`Failed to load on-call: ${error.message}`);

  const byDay: Record<string, string> = {};
  for (const r of data ?? []) byDay[r.on_call_date] = r.staff_id;
  return byDay;
}
