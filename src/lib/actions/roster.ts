"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRosterDays, parseISODate, shiftWeek } from "@/lib/mock-data/roster-schedule";
import type { RosterCopyResult } from "@/types/domain";

const BUILDING = "wesley";

// Auto-save one shift toggle for a staffer on a date: delete the row if it
// already exists, otherwise insert it. Called on every picker click.
export async function toggleRosterShift(
  staffId: string,
  dateISO: string,
  shiftId: string,
): Promise<void> {
  if (!staffId || !dateISO || !shiftId) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roster_shifts")
    .select("id")
    .eq("building_id", BUILDING)
    .eq("staff_id", staffId)
    .eq("shift_date", dateISO)
    .eq("shift_id", shiftId)
    .maybeSingle();
  if (error) throw new Error(`Failed to read roster cell: ${error.message}`);

  if (data) {
    const { error: delErr } = await supabase.from("roster_shifts").delete().eq("id", data.id);
    if (delErr) throw new Error(`Failed to remove shift: ${delErr.message}`);
  } else {
    const { error: insErr } = await supabase.from("roster_shifts").insert({
      building_id: BUILDING,
      staff_id: staffId,
      shift_date: dateISO,
      shift_id: shiftId,
    });
    if (insErr) throw new Error(`Failed to add shift: ${insErr.message}`);
  }
  revalidatePath("/portal/roster");
}

// Copy the previous week's assignments onto the week starting `weekStartISO`,
// for every staffer or just one when `staffId` is given.
//
// Merge, never overwrite: shifts the target week already has are left exactly as
// they are, and only the ones it is missing get added. That falls out of the
// `unique (staff_id, shift_date, shift_id)` constraint plus `ignoreDuplicates`,
// which makes the whole thing idempotent - pressing the button twice adds
// nothing the second time. `.select()` under DO NOTHING returns only the rows
// actually inserted, which is what the caller merges into its grid.
export async function copyPreviousWeek(
  weekStartISO: string,
  staffId?: string,
): Promise<RosterCopyResult> {
  if (!weekStartISO) return { added: [], message: "Thiếu tuần đích." };

  const prevStartISO = shiftWeek(weekStartISO, -1);
  const prevEndISO = getRosterDays(parseISODate(prevStartISO))[6].iso;

  const supabase = await createClient();
  let query = supabase
    .from("roster_shifts")
    .select("staff_id, shift_date, shift_id")
    .eq("building_id", BUILDING)
    .gte("shift_date", prevStartISO)
    .lte("shift_date", prevEndISO);
  if (staffId) query = query.eq("staff_id", staffId);

  const { data: source, error: readErr } = await query;
  if (readErr) return { added: [], message: "Không đọc được lịch tuần trước." };
  if (!source?.length) return { added: [], message: "Tuần trước chưa có ca nào để chép." };

  const rows = source.map((r) => ({
    building_id: BUILDING,
    staff_id: r.staff_id,
    // Same weekday, one week on.
    shift_date: shiftWeek(r.shift_date, 1),
    shift_id: r.shift_id,
  }));

  const { data: inserted, error: writeErr } = await supabase
    .from("roster_shifts")
    .upsert(rows, { onConflict: "staff_id,shift_date,shift_id", ignoreDuplicates: true })
    .select("staff_id, shift_date, shift_id");
  if (writeErr) return { added: [], message: "Không chép được lịch, thử lại." };

  const added = (inserted ?? []).map((r) => ({
    staffId: r.staff_id,
    dateISO: r.shift_date,
    shiftId: r.shift_id,
  }));

  if (added.length) revalidatePath("/portal/roster");
  return {
    added,
    message: added.length ? undefined : "Tuần này đã có đủ ca của tuần trước.",
  };
}

// Clear every shift for a staffer on a date ("Day off").
export async function clearRosterCell(staffId: string, dateISO: string): Promise<void> {
  if (!staffId || !dateISO) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("roster_shifts")
    .delete()
    .eq("building_id", BUILDING)
    .eq("staff_id", staffId)
    .eq("shift_date", dateISO);
  if (error) throw new Error(`Failed to clear roster cell: ${error.message}`);
  revalidatePath("/portal/roster");
}

// Auto-save the on-call picker for one date: upsert the covering staffer.
export async function setOnCallDay(dateISO: string, staffId: string): Promise<void> {
  if (!dateISO || !staffId) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("roster_on_call")
    .upsert(
      { building_id: BUILDING, on_call_date: dateISO, staff_id: staffId },
      { onConflict: "building_id,on_call_date" },
    );
  if (error) throw new Error(`Failed to set on-call: ${error.message}`);
  revalidatePath("/portal/roster");
}

// Clear the on-call assignment for a date (picker set back to "—").
export async function clearOnCallDay(dateISO: string): Promise<void> {
  if (!dateISO) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("roster_on_call")
    .delete()
    .eq("building_id", BUILDING)
    .eq("on_call_date", dateISO);
  if (error) throw new Error(`Failed to clear on-call: ${error.message}`);
  revalidatePath("/portal/roster");
}
