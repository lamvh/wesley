import { createClient } from "@/lib/supabase/server";
import { getShiftTemplates } from "@/lib/data/staff";
import { getRosterDays, parseISODate, shiftWeek } from "@/lib/mock-data/roster-schedule";
import {
  rosterCellKey,
  type RosterGrid,
  type ShiftType,
  type ShiftUsageByStaff,
} from "@/types/domain";

const BUILDING = "wesley";

/** How far back "thường làm" looks. Eight weeks is long enough for a pattern to
 *  show through an odd week, short enough to follow someone changing shifts. */
const USAGE_WEEKS = 8;

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

// How often each staffer has been given each shift over the USAGE_WEEKS weeks
// BEFORE the week on screen, most-assigned first. Feeds the "Thường làm"
// shortcut at the top of the cell picker.
//
// The displayed week is deliberately excluded: it is the week being edited, so
// counting it would let a shift just assigned by hand promote itself to a
// "usual" one and rank above a genuine habit.
//
// Frequency is counted per staffer across the whole window rather than per
// weekday. Per-weekday ("she works mornings on Mondays") is the stronger signal
// in principle, but the data doesn't carry it yet - as of 2026-07-27 only 25 of
// 154 (staff, weekday, shift) combinations had ever repeated, so a weekday-keyed
// suggestion would mostly be guessing off a single occurrence.
//
// The full sorted list is returned, not a top-N: the picker filters it to the
// shifts that staffer can actually be given before capping, so trimming here
// would silently shrink the shortcut after a role change.
export async function getShiftUsageByStaff(weekStartISO: string): Promise<ShiftUsageByStaff> {
  const fromISO = shiftWeek(weekStartISO, -USAGE_WEEKS);
  // Last day before the displayed week, i.e. the Sunday that closes the week prior.
  const toISO = getRosterDays(parseISODate(shiftWeek(weekStartISO, -1)))[6].iso;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roster_shifts")
    .select("staff_id,shift_id")
    .eq("building_id", BUILDING)
    .gte("shift_date", fromISO)
    .lte("shift_date", toISO);
  // A missing history is not worth failing the page over - the picker simply
  // renders without its shortcut section.
  if (error || !data) return {};

  const counts = new Map<string, Map<string, number>>();
  for (const r of data) {
    let perShift = counts.get(r.staff_id);
    if (!perShift) counts.set(r.staff_id, (perShift = new Map()));
    perShift.set(r.shift_id, (perShift.get(r.shift_id) ?? 0) + 1);
  }

  const usage: ShiftUsageByStaff = {};
  for (const [staffId, perShift] of counts) {
    usage[staffId] = [...perShift.entries()]
      .map(([shiftId, count]) => ({ shiftId, count }))
      // Ties broken by shift id so the order is stable between renders.
      .sort((a, b) => b.count - a.count || a.shiftId.localeCompare(b.shiftId));
  }
  return usage;
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
