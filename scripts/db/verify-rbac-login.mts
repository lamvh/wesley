/**
 * End-to-end check of the RBAC lookup: sign in as the owner with the anon key
 * (exactly what the app does), then read app_users under that session (RLS) —
 * mirroring getCurrentUser(). Run: npx tsx scripts/db/verify-rbac-login.mts
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

const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;

async function main() {
  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  const signIn = await supabase.auth.signInWithPassword({
    email: "vhlam1997@gmail.com",
    password: "Wsl-03uuWDhXDKfl9",
  });
  if (signIn.error) throw new Error(`sign-in failed: ${signIn.error.message}`);
  console.log(`✓ signed in as ${signIn.data.user?.email} (${signIn.data.user?.id})`);

  const { data, error } = await supabase
    .from("app_users")
    .select("name, role_id, status")
    .eq("auth_id", signIn.data.user!.id)
    .maybeSingle();
  if (error) throw new Error(`app_users read (RLS) failed: ${error.message}`);

  console.log("✓ RBAC lookup under session (RLS):", data);
  const ok = data?.role_id === "super_admin" && data?.status === "Active";
  console.log(ok ? "✓ PASS — owner resolves to active super_admin → portal grants access" : "✗ FAIL");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
