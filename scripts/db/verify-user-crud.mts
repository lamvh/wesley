/**
 * Simulates updateUser/deleteUser/recoverUser mechanics against the real DB:
 * update persists, soft-delete sets deleted_at, recover clears it. Cleans up
 * after itself. Run: npx tsx scripts/db/verify-user-crud.mts
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

const USERNAME = "verify_crud_user";
const PASSWORD = "Verify-crud-123";

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
  const authId = created.data.user!.id;
  await admin.from("app_users").insert({
    auth_id: authId, username: USERNAME, email: null, name: "Verify Crud",
    role_id: "carer", building_id: "wesley", status: "Active",
  });

  // update: role + building + name
  await admin.from("app_users").update({ role_id: "nurse", building_id: "lodge", name: "Verify Renamed" })
    .eq("username", USERNAME);
  const after = await admin.from("app_users")
    .select("role_id, building_id, name").eq("username", USERNAME).maybeSingle();
  if (after.data?.role_id !== "nurse" || after.data?.building_id !== "lodge") throw new Error("FAIL: update not persisted");

  // soft-delete + recover
  await admin.from("app_users").update({ deleted_at: new Date().toISOString() }).eq("username", USERNAME);
  const del = await admin.from("app_users").select("deleted_at").eq("username", USERNAME).maybeSingle();
  if (!del.data?.deleted_at) throw new Error("FAIL: soft-delete not set");
  await admin.from("app_users").update({ deleted_at: null }).eq("username", USERNAME);
  const rec = await admin.from("app_users").select("deleted_at").eq("username", USERNAME).maybeSingle();
  if (rec.data?.deleted_at) throw new Error("FAIL: recover did not clear deleted_at");

  console.log("✓ PASS - update, soft-delete, recover persist correctly");
  await cleanup();
}
main().catch(async (e) => { await cleanup(); console.error(e.message ?? e); process.exit(1); });
