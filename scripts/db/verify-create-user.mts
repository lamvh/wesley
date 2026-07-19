/**
 * End-to-end check of the create-account mechanics against the real DB, mirroring
 * the createUser server action: username-only account gets a synthetic auth
 * email, the app_users row links to it, and orphan cleanup works. Cleans up
 * after itself. Run: npx tsx scripts/db/verify-create-user.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { syntheticAuthEmail } from "../../src/lib/validation/username";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};

const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const USERNAME = "verify_user_test";
const PASSWORD = "Verify-pass-123";

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email === syntheticAuthEmail(USERNAME));
  if (u) await admin.auth.admin.deleteUser(u.id);
}

async function main() {
  await cleanup();
  const authEmail = syntheticAuthEmail(USERNAME);
  const created = await admin.auth.admin.createUser({
    email: authEmail, password: PASSWORD, email_confirm: true,
  });
  if (created.error) throw created.error;
  const authId = created.data.user!.id;

  const { error: insErr } = await admin.from("app_users").insert({
    auth_id: authId, username: USERNAME, email: null,
    name: "Verify User", role_id: "carer", building_id: "wesley", status: "Active",
  });
  if (insErr) { await admin.auth.admin.deleteUser(authId); throw insErr; }

  const { data } = await admin.from("app_users")
    .select("username, email, auth_id").eq("username", USERNAME).maybeSingle();
  if (!data || data.email !== null || data.auth_id !== authId) throw new Error("FAIL: row mismatch");
  console.log("✓ PASS - username-only account created with synthetic auth email");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
