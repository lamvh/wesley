"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/current-user";
import {
  normalizeUsername, validateUsername, isValidEmail, syntheticAuthEmail,
} from "@/lib/validation/username";

export interface CreateUserState { error?: string; ok?: boolean }
export interface MutateUserState { error?: string; ok?: boolean }

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Shared admin guard: returns null when caller may manage accounts, else an
// error state. Must run before any service-role admin.* call. Exported so
// other account-management actions (e.g. lib/actions/user-roles.ts) reuse the
// same check instead of re-implementing it.
export async function requireAdmin(): Promise<MutateUserState | null> {
  const me = await getCurrentUser();
  const role = me?.appUser?.role_id;
  if (role !== "super_admin" && role !== "admin") return { error: "Bạn không có quyền quản lý tài khoản." };
  return null;
}

// Admin-only: creates a Supabase Auth account (with an admin-set password) plus
// the linked app_users row. Username is required; email is optional. With no
// email, the auth account uses a synthetic address so it can exist mailbox-free.
// This uses the service-role client, which bypasses RLS entirely - the role
// check below is the only thing standing between any signed-in account and
// arbitrary account creation, so it must run before any admin.* call.
export async function createUser(
  _prev: CreateUserState,
  fd: FormData,
): Promise<CreateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const name = str(fd, "name");
  const rawUsername = str(fd, "username");
  const rawEmail = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const scope = str(fd, "scope");
  const building = str(fd, "building") || "wesley";

  if (!name) return { error: "Vui lòng nhập họ tên." };
  const usernameError = validateUsername(rawUsername);
  if (usernameError) return { error: usernameError };
  if (rawEmail && !isValidEmail(rawEmail)) return { error: "Email không hợp lệ." };
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };
  if (!role) return { error: "Vui lòng chọn vai trò." };

  const username = normalizeUsername(rawUsername);
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const authEmail = email ?? syntheticAuthEmail(username);

  const admin = createAdminClient();

  const created = await admin.auth.admin.createUser({
    email: authEmail, password, email_confirm: true,
    user_metadata: { name },
  });
  if (created.error) {
    // Most commonly a duplicate email at the auth layer.
    return { error: "Không tạo được tài khoản (email có thể đã tồn tại)." };
  }
  const authId = created.data.user!.id;

  const { error: insErr } = await admin.from("app_users").insert({
    auth_id: authId, username, email, name, role_id: role,
    building_id: building, scope: scope || null, status: "Active",
  });
  if (insErr) {
    // Roll back the orphaned auth user so a retry can reuse the username/email.
    await admin.auth.admin.deleteUser(authId);
    // 23505 = unique_violation (username or email already taken).
    if (insErr.code === "23505") return { error: "Username hoặc email đã tồn tại." };
    return { error: "Không lưu được tài khoản, thử lại." };
  }

  revalidatePath("/portal/users");
  return { ok: true };
}

// Updates every editable field of an account. Password/username/email are pushed
// to Supabase Auth (auth.users) as well as app_users so login stays consistent;
// a blank password means "leave unchanged". Admin-only.
export async function updateUser(
  _prev: MutateUserState,
  fd: FormData,
): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const original = str(fd, "originalUsername");
  const name = str(fd, "name");
  const rawUsername = str(fd, "username");
  const rawEmail = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const scope = str(fd, "scope");
  const building = str(fd, "building") || "wesley";

  if (!original) return { error: "Thiếu tài khoản cần sửa." };
  if (!name) return { error: "Vui lòng nhập họ tên." };
  const usernameError = validateUsername(rawUsername);
  if (usernameError) return { error: usernameError };
  if (rawEmail && !isValidEmail(rawEmail)) return { error: "Email không hợp lệ." };
  if (password && password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự." };
  if (!role) return { error: "Vui lòng chọn vai trò." };

  const username = normalizeUsername(rawUsername);
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const admin = createAdminClient();

  // Find the auth_id for the account being edited.
  const { data: row } = await admin
    .from("app_users").select("auth_id").eq("username", original).maybeSingle();
  if (!row) return { error: "Không tìm thấy tài khoản." };
  const authId = row.auth_id as string;

  // Sync auth.users: login email always tracks real email or synthetic address;
  // password only when a new one was typed.
  const authEmail = email ?? syntheticAuthEmail(username);
  const authPatch: { email: string; password?: string } = { email: authEmail };
  if (password) authPatch.password = password;
  const upd = await admin.auth.admin.updateUserById(authId, authPatch);
  if (upd.error) return { error: "Không cập nhật được đăng nhập (email có thể trùng)." };

  const { error: rowErr } = await admin.from("app_users").update({
    username, email, name, role_id: role, scope: scope || null, building_id: building,
  }).eq("username", original);
  if (rowErr) {
    if (rowErr.code === "23505") return { error: "Username hoặc email đã tồn tại." };
    return { error: "Không lưu được thay đổi, thử lại." };
  }

  revalidatePath("/portal/users");
  return { ok: true };
}

// Soft-delete: mark the row removed (recoverable) rather than dropping it. The
// auth account stays but signIn refuses removed accounts.
export async function deleteUser(username: string): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!username) return { error: "Thiếu tài khoản." };
  const admin = createAdminClient();
  const { error } = await admin.from("app_users")
    .update({ deleted_at: new Date().toISOString() }).eq("username", username);
  if (error) return { error: "Không xoá được tài khoản, thử lại." };
  revalidatePath("/portal/users");
  return { ok: true };
}

// Restore a soft-deleted account.
export async function recoverUser(username: string): Promise<MutateUserState> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!username) return { error: "Thiếu tài khoản." };
  const admin = createAdminClient();
  const { error } = await admin.from("app_users")
    .update({ deleted_at: null }).eq("username", username);
  if (error) return { error: "Không khôi phục được, thử lại." };
  revalidatePath("/portal/users");
  return { ok: true };
}
