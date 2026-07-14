import { createClient } from "@/lib/supabase/server";
import type { RoleDef, RoleGroup } from "@/types/domain";

const BUILDING = "wesley";

// The ordered roster bands. sort_order sequences them top-to-bottom.
export async function getRoleGroups(): Promise<RoleGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("role_groups")
    .select("id,label,color,tint,sort_order")
    .eq("building_id", BUILDING).order("sort_order");
  if (error) throw new Error(`Failed to load role groups: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id, label: r.label, color: r.color ?? "#2C3563",
    tint: r.tint ?? "#E4E6F2", sortOrder: r.sort_order ?? 0,
  }));
}

// The role registry — every assignable role plus the group it bands into.
export async function getRoles(): Promise<RoleDef[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("staff_roles")
    .select("name,color,tint,group_id,sort_order")
    .eq("building_id", BUILDING).order("sort_order").order("name");
  if (error) throw new Error(`Failed to load roles: ${error.message}`);
  return (data ?? []).map((r) => ({
    name: r.name, color: r.color ?? "#5B5347",
    tint: r.tint ?? "#EFE7D7", groupId: r.group_id ?? null,
    sortOrder: r.sort_order ?? 0,
  }));
}
