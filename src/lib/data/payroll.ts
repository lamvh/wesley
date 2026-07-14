import { createClient } from "@/lib/supabase/server";

const BUILDING = "wesley";

export interface PayrollHours {
  hours: number;
  shiftCount: number;
}

// Per-staff paid hours + shift count drawn from the persisted weekly roster grid
// for [weekStartISO, weekEndISO]. Each assigned shift contributes its template's
// `paid_hours`. The roster is the source of truth for hours; the Payroll tab
// multiplies these by the (editable) per-role rate to get gross pay.
export async function getPayrollHours(
  weekStartISO: string,
  weekEndISO: string,
): Promise<Record<string, PayrollHours>> {
  const supabase = await createClient();
  // Paid hours per template are loaded across all buildings: a roster cell may
  // hold a shift whose template belongs to another building (The Lodge).
  const [templates, assignments] = await Promise.all([
    supabase.from("shift_templates").select("id,paid_hours"),
    supabase
      .from("roster_shifts")
      .select("staff_id,shift_id")
      .eq("building_id", BUILDING)
      .gte("shift_date", weekStartISO)
      .lte("shift_date", weekEndISO),
  ]);
  if (templates.error) throw new Error(`Failed to load shift hours: ${templates.error.message}`);
  if (assignments.error) throw new Error(`Failed to load roster: ${assignments.error.message}`);

  const paid = new Map(
    (templates.data ?? []).map((t) => [t.id, t.paid_hours != null ? Number(t.paid_hours) : 0]),
  );

  const out: Record<string, PayrollHours> = {};
  for (const r of assignments.data ?? []) {
    const bucket = (out[r.staff_id] ??= { hours: 0, shiftCount: 0 });
    bucket.hours += paid.get(r.shift_id) ?? 0;
    bucket.shiftCount += 1;
  }
  return out;
}
