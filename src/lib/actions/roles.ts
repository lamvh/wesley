"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUILDING = "wesley";
export interface RoleFormState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function revalidate() {
  // Roles/groups drive both the staff screen (registry + modal) and the roster
  // banding, so any change must refresh both.
  revalidatePath("/portal/staff");
  revalidatePath("/portal/roster");
}

// Curated swatches (colour + matching tint) auto-assigned to new roles/groups so
// the palette stays consistent without asking the admin to pick colours.
const PALETTE: { color: string; tint: string }[] = [
  { color: "#2C5A6E", tint: "#D8EAF0" },
  { color: "#6E875E", tint: "#E5EBDD" },
  { color: "#8a4b6b", tint: "#F2DEE8" },
  { color: "#c08a3e", tint: "#EDE6D3" },
  { color: "#3d6b74", tint: "#E1EAEC" },
  { color: "#93502F", tint: "#F1E0D3" },
  { color: "#2C3563", tint: "#E4E6F2" },
  { color: "#6b5a2c", tint: "#F0E7CE" },
];
function paletteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `g_${Date.now()}`;

// ---- roles ----
export async function saveRole(_prev: RoleFormState, fd: FormData): Promise<RoleFormState> {
  const name = str(fd, "name");
  if (!name) return { error: "Role name is required." };
  const pal = paletteFor(name);
  const supabase = await createClient();
  // New roles are unassigned; sort them after the current unassigned roles.
  const { data: last } = await supabase.from("staff_roles")
    .select("sort_order").eq("building_id", BUILDING).is("group_id", null)
    .order("sort_order", { ascending: false }).limit(1);
  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("staff_roles")
    .insert({ building_id: BUILDING, name, color: pal.color, tint: pal.tint, sort_order: nextOrder });
  if (error) {
    if (error.code === "23505") return { error: `Role "${name}" already exists.` };
    return { error: error.message };
  }
  revalidate();
  return {};
}

// Rename a role, cascading the new name across staff + shift templates via the
// rename_role RPC (single transaction). Blocks on a duplicate name.
export async function renameRole(oldName: string, newName: string): Promise<void> {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to || from === to) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_role", { p_building: BUILDING, p_old: from, p_new: to });
  if (error) throw new Error(error.message || `Failed to rename "${from}".`);
  revalidate();
}

export async function deleteRole(fd: FormData): Promise<void> {
  const name = str(fd, "name");
  if (!name) return;
  const supabase = await createClient();
  // Block deleting a role that staff are still assigned to.
  const { data, error: readErr } = await supabase.from("staff")
    .select("id").eq("building_id", BUILDING).contains("roles", [name]).limit(1);
  if (readErr) throw new Error(`Failed to check role usage: ${readErr.message}`);
  if (data && data.length) throw new Error(`"${name}" is still assigned to staff.`);
  const { error } = await supabase.from("staff_roles")
    .delete().eq("building_id", BUILDING).eq("name", name);
  if (error) throw new Error(`Failed to remove role: ${error.message}`);
  revalidate();
}

// Reorder a role within its own group (or within the unassigned bucket) by one
// step in `dir` (-1 up). Renormalises the group's sort_order to a distinct 0..n
// sequence after the swap, so it stays correct even when rows shared a value.
export async function moveRole(name: string, dir: -1 | 1): Promise<void> {
  if (!name) return;
  const supabase = await createClient();
  const { data: self, error: selfErr } = await supabase.from("staff_roles")
    .select("group_id").eq("building_id", BUILDING).eq("name", name).single();
  if (selfErr) throw new Error(`Failed to reorder role: ${selfErr.message}`);
  const groupId = self?.group_id ?? null;

  let q = supabase.from("staff_roles")
    .select("name,sort_order").eq("building_id", BUILDING).order("sort_order").order("name");
  q = groupId == null ? q.is("group_id", null) : q.eq("group_id", groupId);
  const { data, error } = await q;
  if (error) throw new Error(`Failed to reorder role: ${error.message}`);

  const roles = (data ?? []).map((r) => r.name);
  const i = roles.indexOf(name);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= roles.length) return;
  [roles[i], roles[j]] = [roles[j], roles[i]];

  // Write the new distinct order for every role in the group.
  for (let k = 0; k < roles.length; k++) {
    const { error: e } = await supabase.from("staff_roles")
      .update({ sort_order: k }).eq("building_id", BUILDING).eq("name", roles[k]);
    if (e) throw new Error(`Failed to reorder role: ${e.message}`);
  }
  revalidate();
}

// Move a role into a group (or out of every group when groupId is empty).
export async function assignRoleToGroup(name: string, groupId: string | null): Promise<void> {
  if (!name) return;
  const supabase = await createClient();
  const { error } = await supabase.from("staff_roles")
    .update({ group_id: groupId || null }).eq("building_id", BUILDING).eq("name", name);
  if (error) throw new Error(`Failed to assign role: ${error.message}`);
  revalidate();
}

// Set a role's hourly pay rate (NZD) from the Payroll tab. Negative/NaN inputs
// are clamped to 0.
export async function saveRoleRate(name: string, rate: number): Promise<void> {
  if (!name) return;
  const safe = Number.isFinite(rate) && rate > 0 ? rate : 0;
  const supabase = await createClient();
  const { error } = await supabase.from("staff_roles")
    .update({ hourly_rate: safe }).eq("building_id", BUILDING).eq("name", name);
  if (error) throw new Error(`Failed to save rate: ${error.message}`);
  revalidate();
}

// ---- groups ----
export async function saveGroup(_prev: RoleFormState, fd: FormData): Promise<RoleFormState> {
  const label = str(fd, "label");
  if (!label) return { error: "Group name is required." };
  const id = str(fd, "id");
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("role_groups")
      .update({ label }).eq("building_id", BUILDING).eq("id", id);
    if (error) return { error: error.message };
  } else {
    // New group sorts to the bottom.
    const { data } = await supabase.from("role_groups")
      .select("sort_order").eq("building_id", BUILDING).order("sort_order", { ascending: false }).limit(1);
    const nextOrder = (data?.[0]?.sort_order ?? -1) + 1;
    const pal = paletteFor(label);
    const { error } = await supabase.from("role_groups").insert({
      id: slugify(label), building_id: BUILDING, label,
      color: pal.color, tint: pal.tint, sort_order: nextOrder,
    });
    if (error) {
      if (error.code === "23505") return { error: `A group named "${label}" already exists.` };
      return { error: error.message };
    }
  }
  revalidate();
  return {};
}

export async function deleteGroup(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  // Member roles fall back to unassigned via the FK's ON DELETE SET NULL.
  const { error } = await supabase.from("role_groups")
    .delete().eq("building_id", BUILDING).eq("id", id);
  if (error) throw new Error(`Failed to remove group: ${error.message}`);
  revalidate();
}

// Reorder a group by swapping sort_order with its neighbour in `dir` (-1 up).
export async function moveGroup(id: string, dir: -1 | 1): Promise<void> {
  if (!id) return;
  const supabase = await createClient();
  const { data, error } = await supabase.from("role_groups")
    .select("id,sort_order").eq("building_id", BUILDING).order("sort_order");
  if (error) throw new Error(`Failed to reorder group: ${error.message}`);
  const groups = data ?? [];
  const i = groups.findIndex((g) => g.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= groups.length) return;
  const a = groups[i], b = groups[j];
  // Swap the two rows' sort_order values.
  const { error: e1 } = await supabase.from("role_groups")
    .update({ sort_order: b.sort_order }).eq("building_id", BUILDING).eq("id", a.id);
  const { error: e2 } = await supabase.from("role_groups")
    .update({ sort_order: a.sort_order }).eq("building_id", BUILDING).eq("id", b.id);
  if (e1 || e2) throw new Error(`Failed to reorder group: ${(e1 || e2)!.message}`);
  revalidate();
}
