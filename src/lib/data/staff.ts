import { createClient } from "@/lib/supabase/server";
import type { StaffRecord, ShiftTemplate, StaffLeaveRequest } from "@/types/domain";
const BUILDING = "wesley";

export async function getStaff(): Promise<StaffRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff")
    .select("id,name,role,contract,hours,phone,start_label,status,initials,color,annual,taken")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load staff: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, role: r.role ?? "",
    contract: r.contract ?? "", hours: r.hours ?? 0, phone: r.phone ?? "",
    start: r.start_label ?? "", status: r.status ?? "Active",
    initials: r.initials ?? "", color: r.color ?? "#6E875E",
    annual: r.annual ?? 0, taken: r.taken ?? 0,
  }));
}
export async function getShiftTemplates(): Promise<ShiftTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shift_templates")
    .select("id,name,time_label,req,filled,color,tint,border").eq("building_id", BUILDING).order("id");
  if (error) throw new Error(`Failed to load shift templates: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, time: r.time_label ?? "",
    req: r.req, filled: r.filled, color: r.color ?? "#87651A", tint: r.tint ?? "#FCF4DC", border: r.border ?? "#EAD9A4" }));
}
export async function getLeaveRequests(): Promise<StaffLeaveRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leave_requests")
    .select("id,type,from_date,to_date,days,status,note,staff(id,name,initials,color)")
    .eq("building_id", BUILDING).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load leave requests: ${error.message}`);
  return (data ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- nested embed row shape isn't inferred
    const s = (Array.isArray((r as any).staff) ? (r as any).staff[0] : (r as any).staff) ?? {};
    return { id: r.id, staffId: s.id ?? "", name: s.name ?? "", initials: s.initials ?? "", color: s.color ?? "#6E875E",
      type: r.type, from: r.from_date ?? "", to: r.to_date ?? "", days: r.days ?? 0, status: r.status ?? "Pending", note: r.note ?? "" };
  });
}
