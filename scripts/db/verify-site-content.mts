/**
 * Confirms the Website CMS storage works end-to-end:
 *  1. anon (no session) can READ the site_content row — the public marketing
 *     pages depend on this.
 *  2. an authenticated session can WRITE an override and read it back.
 *  3. reset restores the empty override ({} = use code defaults).
 * Run: npx tsx scripts/db/verify-site-content.mts
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

const URL = env("NEXT_PUBLIC_SUPABASE_URL")!;
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;

async function main() {
  // 1. Anonymous read (public marketing site).
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const read = await anon
    .from("site_content")
    .select("content")
    .eq("id", "site")
    .maybeSingle();
  if (read.error) throw new Error(`anon read failed: ${read.error.message}`);
  if (!read.data) throw new Error("no site_content row — did the seed insert run?");
  console.log(`✓ anon read OK — content is ${typeof read.data.content} (${JSON.stringify(read.data.content).slice(0, 40)}…)`);

  // 2. Authenticated write.
  const auth = createClient(URL, ANON, { auth: { persistSession: false } });
  const signIn = await auth.auth.signInWithPassword({
    email: "vhlam1997@gmail.com",
    password: "Wsl-03uuWDhXDKfl9",
  });
  if (signIn.error) throw new Error(signIn.error.message);

  const marker = { hero: { h1: "__CMS_VERIFY__" } };
  const write = await auth
    .from("site_content")
    .upsert({ id: "site", content: marker, updated_at: new Date().toISOString() });
  if (write.error) throw new Error(`authed write failed: ${write.error.message}`);

  const back = await anon
    .from("site_content")
    .select("content")
    .eq("id", "site")
    .maybeSingle();
  const ok = (back.data?.content as { hero?: { h1?: string } })?.hero?.h1 === "__CMS_VERIFY__";
  console.log(ok ? "✓ write persisted & readable by anon" : "⚠ write not reflected in read");

  // 3. Reset to empty override.
  const reset = await auth
    .from("site_content")
    .upsert({ id: "site", content: {}, updated_at: new Date().toISOString() });
  if (reset.error) throw new Error(`reset failed: ${reset.error.message}`);
  console.log("✓ reset to {} (defaults) — done");

  console.log(ok ? "✓ PASS" : "⚠ CHECK write path");
}
main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
