import { createClient } from "@/lib/supabase/server";
import type { StaffRecord, ShiftTemplate, StaffLeaveRequest } from "@/types/domain";
const BUILDING = "wesley";

// Staff status is stored on `staff.status` but nothing writes "On leave" to
// it directly - approving a leave request only debits the balance. So the
// real "on leave" state is derived here: any staff with an approved
// Annual/Sick leave request spanning today counts as on leave regardless of
// the stored column, which otherwise never moves off its "Active" default.
export async function getStaff(): Promise<StaffRecord[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [staffRes, leaveRes] = await Promise.all([
    supabase.from("staff")
      .select("id,name,preferred_name,role,roles,contract,hours,phone,start_label,status,initials,color,annual,taken,visa_type,visa_expiry,roster_group_id")
      .eq("building_id", BUILDING).order("name"),
    supabase.from("leave_requests")
      .select("staff_id")
      .eq("building_id", BUILDING).eq("status", "Approved")
      .in("type", ["Annual leave", "Sick leave"])
      .lte("from_date", today)
      .or(`to_date.is.null,to_date.gte.${today}`),
  ]);
  if (staffRes.error) throw new Error(`Failed to load staff: ${staffRes.error.message}`);
  if (leaveRes.error) throw new Error(`Failed to load leave requests: ${leaveRes.error.message}`);
  const onLeaveIds = new Set((leaveRes.data ?? []).map((r) => r.staff_id));
  return (staffRes.data ?? []).map((r) => ({
    id: r.id, name: r.name, preferredName: r.preferred_name ?? "",
    roles: (r.roles ?? (r.role ? [r.role] : [])).filter(Boolean),
    contract: r.contract ?? "", hours: r.hours ?? 0, phone: r.phone ?? "",
    start: r.start_label ?? "", status: onLeaveIds.has(r.id) ? "On leave" : (r.status ?? "Active"),
    initials: r.initials ?? "", color: r.color ?? "#6E875E",
    annual: r.annual ?? 0, taken: r.taken ?? 0,
    visaType: r.visa_type ?? "", visaExpiry: r.visa_expiry ?? "",
    rosterGroupId: r.roster_group_id ?? null,
  }));
}
// Shift templates for the Staff → Shift-templates tab (all buildings, so the
// tab can group them by building). Pass a buildingId to scope to one building -
// the roster uses this to only offer its own building's shifts.
export async function getShiftTemplates(buildingId?: string): Promise<ShiftTemplate[]> {
  const supabase = await createClient();
  let query = supabase.from("shift_templates")
    .select("id,name,time_label,req,filled,color,tint,border,role,paid_hours,building_id")
    .order("building_id").order("id");
  if (buildingId) query = query.eq("building_id", buildingId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to load shift templates: ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, time: r.time_label ?? "",
    req: r.req, filled: r.filled, color: r.color ?? "#87651A", tint: r.tint ?? "#FCF4DC", border: r.border ?? "#EAD9A4",
    role: r.role ?? "", paidHours: r.paid_hours != null ? Number(r.paid_hours) : 0, building: r.building_id ?? BUILDING }));
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
