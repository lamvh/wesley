/**
 * Confirms the residents screen's query works under a real session (RLS):
 * sign in as the owner, read residents exactly as src/lib/data/residents.ts does.
 * Run: npx tsx scripts/db/verify-residents-read.mts
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

async function main() {
  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const signIn = await supabase.auth.signInWithPassword({
    email: "vhlam1997@gmail.com",
    password: "Wsl-03uuWDhXDKfl9",
  });
  if (signIn.error) throw new Error(signIn.error.message);

  const { data, error } = await supabase
    .from("residents")
    .select("slug,name,wing,care_type,diet")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`residents read failed: ${error.message}`);

  console.log(`✓ residents read under session: ${data.length} rows`);
  for (const r of data.slice(0, 3)) console.log(`   · ${r.name} - ${r.wing} · ${r.care_type}`);
  console.log(data.length === 9 ? "✓ PASS (9 seeded residents)" : `⚠ expected 9, got ${data.length}`);
}
main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
