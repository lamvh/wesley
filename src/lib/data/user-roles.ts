import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

// The account roles from public.roles (source of truth for the Add/Edit user
// role picker, filters, and the Roles & permissions tab). Ids match the
// UserRole union; label is the DB label. `isSystem` roles (super_admin) can't
// be renamed - see lib/actions/user-roles.ts::renameUserRole.
export async function listUserRoles(): Promise<
  { id: UserRole; label: string; isSystem: boolean }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, label, is_system")
    .order("id");
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id as UserRole, label: r.label, isSystem: r.is_system }));
}
