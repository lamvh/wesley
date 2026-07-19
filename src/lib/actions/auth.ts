"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername, resolveAuthEmail } from "@/lib/validation/username";

export interface SignInState { error?: string; ok?: boolean }

const GENERIC = "Sai thông tin đăng nhập.";

// Resolves a username-or-email identifier to the account's Supabase login email
// (server-side, since anonymous users cannot read app_users), then signs in on
// the SSR client so the session cookie is set. Every failure returns the same
// generic message to avoid revealing whether an account exists.
export async function signIn(
  _prev: SignInState,
  fd: FormData,
): Promise<SignInState> {
  const identifier = normalizeUsername(String(fd.get("identifier") ?? ""));
  const password = String(fd.get("password") ?? "");
  if (!identifier || !password) return { error: GENERIC };

  const admin = createAdminClient();

  // Look up by username first, then by email. Two exact-match queries avoid the
  // escaping pitfalls of an .or() filter on free-text input.
  let row: { username: string; email: string | null; deleted_at: string | null } | null = null;
  const byUsername = await admin
    .from("app_users").select("username, email, deleted_at")
    .eq("username", identifier).maybeSingle();
  row = byUsername.data;
  if (!row) {
    const byEmail = await admin
      .from("app_users").select("username, email, deleted_at")
      .eq("email", identifier).maybeSingle();
    row = byEmail.data;
  }
  if (!row || row.deleted_at != null) return { error: GENERIC };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveAuthEmail(row),
    password,
  });
  if (error) return { error: GENERIC };

  return { ok: true };
}
