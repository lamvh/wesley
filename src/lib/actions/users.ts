"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/current-user";
import {
  normalizeUsername, validateUsername, isValidEmail, syntheticAuthEmail,
} from "@/lib/validation/username";

export interface CreateUserState { error?: string; ok?: boolean }

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

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
  const me = await getCurrentUser();
  const callerRole = me?.appUser?.role_id;
  if (callerRole !== "super_admin" && callerRole !== "admin") {
    return { error: "Bạn không có quyền tạo tài khoản." };
  }

  const name = str(fd, "name");
  const rawUsername = str(fd, "username");
  const rawEmail = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const role = str(fd, "role");
  const scope = str(fd, "scope");

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
    building_id: "wesley", scope: scope || null, status: "Active",
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
