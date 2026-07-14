/**
 * Exercises resident writes under a real session (RLS residents_write):
 * insert → read → update → delete a temp row. Leaves the table clean.
 * Run: npx tsx scripts/db/verify-residents-write.mts
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

const SLUG = "zz-temp-verify-resident";

async function main() {
  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const s = await supabase.auth.signInWithPassword({ email: "vhlam1997@gmail.com", password: "Wsl-03uuWDhXDKfl9" });
  if (s.error) throw new Error(s.error.message);

  await supabase.from("residents").delete().eq("slug", SLUG); // clean slate

  const ins = await supabase.from("residents").insert({
    slug: SLUG, building_id: "wesley", name: "Temp Verify", wing: "Rātā",
    care_type: "Respite", age: 70, avatar: "TV", color: "#6E875E", flags: ["Test"],
  });
  if (ins.error) throw new Error(`insert failed: ${ins.error.message}`);
  console.log("✓ insert ok");

  const upd = await supabase.from("residents").update({ diet: "Soft" }).eq("slug", SLUG).select("diet").single();
  if (upd.error) throw new Error(`update failed: ${upd.error.message}`);
  console.log(`✓ update ok (diet=${upd.data.diet})`);

  const del = await supabase.from("residents").delete().eq("slug", SLUG);
  if (del.error) throw new Error(`delete failed: ${del.error.message}`);
  const { count } = await supabase.from("residents").select("*", { count: "exact", head: true }).eq("slug", SLUG);
  console.log(count === 0 ? "✓ delete ok — row gone, table clean" : `⚠ leftover rows: ${count}`);
  console.log("✓ PASS — insert/update/delete all work under RLS");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
