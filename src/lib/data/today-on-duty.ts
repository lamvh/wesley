import { createClient } from "@/lib/supabase/server";
import type { TodayDutyRow } from "@/types/domain";

// Public board data via the SECURITY DEFINER rpc (anon-callable). Returns today's
// (Auckland local) on-duty rows: building, role, name, shift time.
export async function getTodayOnDuty(): Promise<TodayDutyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("today_on_duty");
  if (error || !data) return [];
  return (
    data as { building_id: string; role: string; staff_name: string; shift_time: string }[]
  ).map((r) => ({
    buildingId: r.building_id,
    role: r.role,
    name: r.staff_name,
    time: r.shift_time,
  }));
}
