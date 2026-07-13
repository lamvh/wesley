/**
 * Creates (or updates) the Supabase Auth account for the project owner and sets
 * a temporary password. Role assignment (super_admin) is handled by the seed
 * (app_users), which links to this account by email.
 *
 * Run: npx tsx scripts/db/create-super-admin-user.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function readEnv(key: string): string | undefined {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) throw new Error("Supabase URL / service role key missing in .env.local");

const EMAIL = "vhlam1997@gmail.com";
const NAME = "lamvh";
// Temp password: mixed-case + digits, comfortably above Supabase's policy.
const PASSWORD = `Wsl-${randomBytes(9).toString("base64url")}9`;

async function main() {
  const admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });

  const created = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: NAME },
  });

  if (created.error) {
    // Already exists → find and reset password + reconfirm.
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data.users.find((u) => u.email?.toLowerCase() === EMAIL);
    if (!existing) throw created.error;
    const upd = await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: NAME },
    });
    if (upd.error) throw upd.error;
    console.log(`Updated existing auth user ${EMAIL}`);
    console.log(`  id:       ${existing.id}`);
  } else {
    console.log(`Created auth user ${EMAIL}`);
    console.log(`  id:       ${created.data.user?.id}`);
  }
  console.log(`  name:     ${NAME}`);
  console.log(`  password: ${PASSWORD}   ← temporary, change after first sign-in`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
