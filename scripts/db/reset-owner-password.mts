/**
 * Resets the owner account's password to a clean, easy-to-type value and then
 * verifies sign-in works with it (via the anon client — the same path the app
 * uses). Run: npx tsx scripts/db/reset-owner-password.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};

const EMAIL = "vhlam1997@gmail.com";
const NEW_PASSWORD = "22339997"; // user-chosen

async function main() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
  const admin = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = list.data.users.find((u) => u.email?.toLowerCase() === EMAIL);
  if (!user) throw new Error(`auth user ${EMAIL} not found`);

  const upd = await admin.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD,
    email_confirm: true,
  });
  if (upd.error) throw upd.error;
  console.log(`✓ password reset for ${EMAIL}`);

  // Verify via anon sign-in (exactly what the login form does).
  const anon = createClient(url, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const test = await anon.auth.signInWithPassword({ email: EMAIL, password: NEW_PASSWORD });
  if (test.error) throw new Error(`verify sign-in failed: ${test.error.message}`);
  console.log(`✓ verified sign-in works with the new password`);
  console.log(`\n   Email:    ${EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
