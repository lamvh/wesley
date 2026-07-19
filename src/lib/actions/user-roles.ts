"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, type MutateUserState } from "@/lib/actions/users";

// Renames an account role's display label (public.roles.label). The role id
// (super_admin|admin|nurse|carer|activities|family) is a fixed key used
// throughout the codebase and never changes - only the label shown in the UI.
// `roles` has no write RLS policy for regular sessions (read-only for
// authenticated users), so this goes through the service-role client like the
// other account-management actions; requireAdmin() is the only gate.
export async function renameUserRole(id: string, label: string): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const trimmed = label.trim();
  if (!trimmed) return { error: "Tên vai trò không được để trống." };

  const admin = createAdminClient();
  const { data: role } = await admin.from("roles").select("is_system").eq("id", id).maybeSingle();
  if (!role) return { error: "Không tìm thấy vai trò." };
  if (role.is_system) return { error: "Không thể đổi tên vai trò hệ thống." };

  const { error } = await admin.from("roles").update({ label: trimmed }).eq("id", id);
  if (error) return { error: "Không đổi tên được, thử lại." };

  revalidatePath("/portal/users");
  return { ok: true };
}
