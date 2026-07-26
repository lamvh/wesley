"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, type MutateUserState } from "@/lib/actions/users";
import { getModules, ROLE_KEYS } from "@/lib/mock-data";
import type { ModuleKey, PermissionAction, UserRole } from "@/types/domain";

const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete"];

// Flips one cell of the grant matrix (public.role_permissions).
//
// role_permissions is a read-only reference table for regular sessions - it has
// a select policy for authenticated users and no write policy at all - so this
// goes through the service-role client like the other account-management
// actions, and requireAdmin() is the only gate standing in front of it.
//
// super_admin is deliberately not editable: it is seeded allow-all so that one
// account can always repair the matrix after a bad edit. The UI already locks
// that row; this is the server-side half of the same rule.
export async function setRolePermission(
  role: UserRole,
  module: ModuleKey,
  action: PermissionAction,
  granted: boolean,
): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (role === "super_admin") {
    return { error: "Không thể sửa quyền của Super Admin." };
  }
  if (!ROLE_KEYS.includes(role)) return { error: "Vai trò không hợp lệ." };
  if (!getModules().some((m) => m.key === module)) return { error: "Module không hợp lệ." };
  if (!ACTIONS.includes(action)) return { error: "Hành động không hợp lệ." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("role_permissions")
    .upsert(
      { role_id: role, module, action, granted },
      { onConflict: "role_id,module,action" },
    );
  if (error) return { error: "Không lưu được quyền, thử lại." };

  revalidatePath("/portal/users");
  return { ok: true };
}
