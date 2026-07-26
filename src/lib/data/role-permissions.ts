import { createClient } from "@/lib/supabase/server";
import { getDefaultPermissions, getModules, ROLE_KEYS } from "@/lib/mock-data";
import type {
  ModuleKey,
  PermissionAction,
  PermissionMatrix,
  UserRole,
} from "@/types/domain";

// The live grant matrix from public.role_permissions, shown and edited in
// /portal/users → "Roles & permissions".
//
// The matrix type is total (Record<UserRole, Record<ModuleKey, Permission>>) and
// the UI indexes it without guards, so a row missing from the DB must never
// produce a hole. The code defaults are therefore used as the base layer and DB
// rows are overlaid on top: a role or module the DB has not been seeded with yet
// still renders, and toggling it writes the real row. Reads use the session
// client - role_permissions is select-to-authenticated (writes are service-role
// only, see lib/actions/role-permissions.ts).
export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  const matrix = getDefaultPermissions();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("role_id, module, action, granted");

  // Fail open to the defaults rather than rendering an empty matrix - the tab
  // stays usable pre-seed, and the toggles still persist once clicked.
  if (error || !data) return matrix;

  const roles = new Set<string>(ROLE_KEYS);
  const modules = new Set<string>(getModules().map((m) => m.key));
  const actions = new Set<string>(["view", "create", "edit", "delete"]);

  for (const row of data) {
    // Ignore rows for keys this build doesn't know about (a role or module
    // removed in code but still present in the DB) - they'd widen the matrix
    // past its type and show a column the UI can't label.
    if (!roles.has(row.role_id) || !modules.has(row.module) || !actions.has(row.action)) continue;
    matrix[row.role_id as UserRole][row.module as ModuleKey][row.action as PermissionAction] =
      row.granted;
  }

  return matrix;
}
