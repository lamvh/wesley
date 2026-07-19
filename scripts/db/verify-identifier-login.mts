/**
 * Verifies identifier→login-email resolution + sign-in for both a username-only
 * account and an account with a real email. Uses the anon client to sign in
 * (exactly what the app does). Seeds + cleans up its own test accounts.
 * Run: npx tsx scripts/db/verify-identifier-login.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveAuthEmail, syntheticAuthEmail } from "../../src/lib/validation/username";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const PW = "Verify-login-123";
const A = { username: "verify_login_noemail", email: null as string | null };
const B = { username: "verify_login_email", email: "verify.login.email@example.com" };

async function seed(acct: { username: string; email: string | null }) {
  const authEmail = resolveAuthEmail(acct);
  const created = await admin.auth.admin.createUser({ email: authEmail, password: PW, email_confirm: true });
  const authId = created.data.user!.id;
  await admin.from("app_users").insert({
    auth_id: authId, username: acct.username, email: acct.email,
    name: "Verify Login", role_id: "carer", building_id: "wesley", status: "Active",
  });
}
async function cleanup() {
  for (const u of [A.username, B.username]) await admin.from("app_users").delete().eq("username", u);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const email of [syntheticAuthEmail(A.username), B.email!]) {
    const found = list.data.users.find((x) => x.email === email);
    if (found) await admin.auth.admin.deleteUser(found.id);
  }
}

// Mirrors the signIn action's resolution: look up by username then email, then
// sign in with resolveAuthEmail(row).
async function signInBy(identifier: string, password: string) {
  const byUsername = await admin.from("app_users")
    .select("username, email").eq("username", identifier).maybeSingle();
  let row = byUsername.data;
  if (!row) {
    const byEmail = await admin.from("app_users")
      .select("username, email").eq("email", identifier).maybeSingle();
    row = byEmail.data;
  }
  if (!row) return { error: "no account" };
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const res = await client.auth.signInWithPassword({ email: resolveAuthEmail(row), password });
  return { session: res.data.session, error: res.error?.message };
}

async function main() {
  await cleanup();
  await seed(A);
  await seed(B);

  const a = await signInBy(A.username, PW);
  if (!a.session) throw new Error(`FAIL: username-only login: ${a.error}`);

  const bU = await signInBy(B.username, PW);
  if (!bU.session) throw new Error(`FAIL: login by username (has email): ${bU.error}`);

  const bE = await signInBy(B.email!, PW);
  if (!bE.session) throw new Error(`FAIL: login by email: ${bE.error}`);

  const wrong = await signInBy(A.username, "wrong-pass");
  if (wrong.session) throw new Error("FAIL: wrong password accepted");

  console.log("✓ PASS - username-only, username+email, and email logins all resolve; bad password rejected");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
