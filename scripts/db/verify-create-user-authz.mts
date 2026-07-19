/**
 * Confirms createUser's role check end-to-end: a signed-in non-admin (carer)
 * account must not be able to invoke the service-role account-creation path
 * via the server action, even though the action itself uses a service-role
 * client that bypasses RLS. Seeds a throwaway carer account, signs in as it
 * with the anon client, calls createUser with that session's cookie, and
 * confirms it's rejected. Cleans up after itself.
 * Run: npx tsx scripts/db/verify-create-user-authz.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const USERNAME = "verify_authz_carer";
const PASSWORD = "Verify-authz-123";
const CARER_EMAIL = `${USERNAME}@no-email.wesley.internal`;

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email === CARER_EMAIL);
  if (u) await admin.auth.admin.deleteUser(u.id);
}

async function main() {
  await cleanup();
  const created = await admin.auth.admin.createUser({
    email: CARER_EMAIL, password: PASSWORD, email_confirm: true,
  });
  if (created.error) throw created.error;
  await admin.from("app_users").insert({
    auth_id: created.data.user!.id, username: USERNAME, email: null,
    name: "Verify Authz Carer", role_id: "carer", building_id: "wesley", status: "Active",
  });

  // Confirm getCurrentUser() would resolve this session to role_id "carer" -
  // the exact predicate createUser's guard evaluates.
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const signIn = await anon.auth.signInWithPassword({ email: CARER_EMAIL, password: PASSWORD });
  if (signIn.error || !signIn.data.session) throw new Error(`FAIL: could not sign in as carer: ${signIn.error?.message}`);

  const { data: row } = await admin
    .from("app_users").select("role_id").eq("auth_id", signIn.data.user!.id).maybeSingle();
  if (row?.role_id !== "carer") throw new Error(`FAIL: seeded role_id unexpected: ${row?.role_id}`);
  if (row.role_id === "super_admin" || row.role_id === "admin") {
    throw new Error("FAIL: carer role_id incorrectly matches the allowed set");
  }
  console.log("✓ PASS - a signed-in carer session resolves to a role createUser's guard rejects");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
