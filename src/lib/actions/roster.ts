"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
