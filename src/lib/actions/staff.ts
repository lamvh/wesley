"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUILDING = "wesley";
export interface StaffFormState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v ? Number(v) : 0; };

// Weekly hours implied by the employment contract type — the roster and leave
// accrual screens both key off this instead of a free-text hours field.
const CONTRACT_HOURS: Record<string, number> = { "Full-time": 40, "Part-time": 24, Casual: 12 };

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export async function saveStaff(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const contract = str(fd, "contract");
  const visaType = str(fd, "visaType");
  // Citizens / permanent residents have no visa to expire.
  const noExpiry = visaType === "NZ Citizen" || visaType === "Permanent Resident";
  const fields = {
    name, role: str(fd, "role") || null,
    contract: contract || null, hours: CONTRACT_HOURS[contract] ?? 0,
    phone: str(fd, "phone") || null, initials: initialsOf(name),
    visa_type: visaType || null,
    visa_expiry: noExpiry ? null : (str(fd, "visaExpiry") || null),
  };
  const supabase = await createClient();
  if (id) {
    // Edit: never touch annual/taken here — those are only adjusted via
    // approve_leave, so a re-save of the profile fields can't clobber balances.
    const { error } = await supabase.from("staff").update(fields).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("staff")
      .insert({ ...fields, building_id: BUILDING, annual: 20, taken: 0 });
    if (error) return { error: error.message };
  }
  revalidatePath("/portal/staff");
  return {};
}

export async function deleteStaff(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove staff member: ${error.message}`);
  revalidatePath("/portal/staff");
}

// The 6 seed shift colours (supabase/migrations/0003_staff_admin.sql /
// scripts/db/seed-staff.mts) — a chosen base colour resolves to its matching
// tint/border pair so the roster keeps a consistent, curated palette.
const SHIFT_PALETTE: { color: string; tint: string; border: string }[] = [
  { color: "#87651A", tint: "#FCF4DC", border: "#EAD9A4" },
  { color: "#8A6516", tint: "#FBEFC8", border: "#E7CE8A" },
  { color: "#9A4A70", tint: "#F7DFEA", border: "#E5B2CB" },
  { color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  { color: "#3B4E74", tint: "#E3E8F5", border: "#B4C1DF" },
  { color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
];
function resolveShiftPalette(color: string) {
  return SHIFT_PALETTE.find((p) => p.color.toLowerCase() === color.toLowerCase()) ?? SHIFT_PALETTE[0];
}

export async function saveShiftTemplate(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const id = str(fd, "id") || `sh-${Date.now()}`;
  const palette = resolveShiftPalette(str(fd, "color"));
  const supabase = await createClient();
  const { error } = await supabase.from("shift_templates").upsert({
    id, building_id: BUILDING, name, time_label: str(fd, "time") || null,
    req: num(fd, "req"), filled: num(fd, "filled"),
    color: palette.color, tint: palette.tint, border: palette.border,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/staff");
  return {};
}

export async function deleteShiftTemplate(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("shift_templates").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove shift template: ${error.message}`);
  revalidatePath("/portal/staff");
}

export async function saveLeave(_prev: StaffFormState, fd: FormData): Promise<StaffFormState> {
  const staffId = str(fd, "staffId");
  if (!staffId) return { error: "Choose a staff member." };
  const type = str(fd, "type");
  if (!type) return { error: "Choose a leave type." };
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({
    building_id: BUILDING, staff_id: staffId, type,
    from_date: str(fd, "from") || null, to_date: str(fd, "to") || null,
    days: num(fd, "days") || 1, note: str(fd, "note") || null, status: "Pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/staff");
  return {};
}

export async function approveLeave(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_leave", { p_id: id });
  if (error) throw new Error(`Failed to approve leave: ${error.message}`);
  revalidatePath("/portal/staff");
}

export async function declineLeave(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").update({ status: "Declined" }).eq("id", id);
  if (error) throw new Error(`Failed to decline leave: ${error.message}`);
  revalidatePath("/portal/staff");
}
