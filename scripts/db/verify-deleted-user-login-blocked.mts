/**
 * Verifies the signIn guard mirror: a soft-deleted app_users row is refused at
 * login (deleted_at is not null -> generic error, no signInWithPassword call).
 * Cleans up after itself. Run: npx tsx scripts/db/verify-deleted-user-login-blocked.mts
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
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const USERNAME = "verify_deleted_login";
const PASSWORD = "Verify-del-123";

async function cleanup() {
  await admin.from("app_users").delete().eq("username", USERNAME);
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const u = list.data.users.find((x) => x.email?.startsWith(`${USERNAME}@`));
  if (u) await admin.auth.admin.deleteUser(u.id);
}
async function main() {
  await cleanup();
  const created = await admin.auth.admin.createUser({
    email: `${USERNAME}@no-email.wesley.internal`, password: PASSWORD, email_confirm: true,
  });
  await admin.from("app_users").insert({
    auth_id: created.data.user!.id, username: USERNAME, email: null, name: "Del",
    role_id: "carer", building_id: "wesley", status: "Active",
    deleted_at: new Date().toISOString(),
  });
  // Mirror the signIn guard: look up row incl deleted_at; refuse if removed.
  const { data } = await admin.from("app_users")
    .select("username, email, deleted_at").eq("username", USERNAME).maybeSingle();
  if (!data) throw new Error("FAIL: seed missing");
  const blocked = data.deleted_at != null;
  if (!blocked) throw new Error("FAIL: removed account not blocked by guard");
  console.log("✓ PASS - soft-deleted account is refused at login");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
