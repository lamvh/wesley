/**
 * Verifies that the website CMS is admin-only after
 * 0026_site_content_admin_write.sql.
 *
 * The point of the migration is that hiding the nav item was concealment, not
 * enforcement - so this checks the door itself, not the UI:
 *
 *   1. anon can still READ site_content (the marketing site is public).
 *   2. anon CANNOT write it.
 *   3. a signed-in NON-ADMIN account cannot write it either - this is the hole
 *      0026 closes, and the one a UI-only check would miss.
 *   4. the service-role client (what the admin-gated server action uses) still
 *      can, so the CMS keeps working.
 *
 * Restores whatever it changes. Needs a non-admin login to prove (3); pass one
 * as arguments, otherwise that check is reported as skipped rather than passed.
 *
 * Run: npx tsx scripts/db/verify-site-content-admin-write.mts [identifier] [password]
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
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
const admin = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};
const skip = (msg: string) => console.log(`- BỎ QUA: ${msg}`);

// Keep the real content safe.
const { data: before } = await admin
  .from("site_content").select("content").eq("id", "site").maybeSingle();
const original = before?.content ?? {};

// ── 1 + 2. anonymous ──
{
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: readErr } = await anon.from("site_content").select("content").eq("id", "site");
  check(!readErr, `anon ĐỌC được (marketing site là công khai)${readErr ? `: ${readErr.message}` : ""}`);

  const { error: writeErr } = await anon
    .from("site_content")
    .upsert({ id: "site", content: { hacked: true } });
  check(!!writeErr, `anon KHÔNG ghi được${writeErr ? ` (${writeErr.code ?? ""} ${writeErr.message.slice(0, 48)})` : " ← GHI ĐƯỢC, SAI!"}`);
}

// ── 3. a signed-in non-admin ── THE check: this is the exact hole 0026 closes,
// and the one a UI-only "hide the nav item" fix would leave wide open.
//
// Rather than reporting SKIPPED, provision a throwaway carer account with the
// service-role admin API, sign in as them, and try the write for real. Removed
// again at the end whatever the outcome.
{
  const [identifier, password] = process.argv.slice(2);
  const tempEmail = `zz-verify-cms-${Date.now()}@wesley.local`;
  const tempPassword = `Zz!${Date.now()}aA`;
  let tempAuthId: string | null = null;

  let email = identifier;
  let pw = password;

  if (!identifier || !password) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: tempEmail, password: tempPassword, email_confirm: true,
    });
    if (cErr || !created.user) {
      skip(`không tạo được tài khoản tạm để kiểm: ${cErr?.message}`);
    } else {
      tempAuthId = created.user.id;
      await admin.from("app_users").insert({
        auth_id: tempAuthId, name: "ZZ Verify CMS", username: `zz-verify-cms-${Date.now()}`,
        email: tempEmail, role_id: "carer", status: "Active", building_id: "wesley",
      });
      email = tempEmail;
      pw = tempPassword;
      console.log("  (đã tạo tài khoản 'carer' tạm để kiểm — sẽ xoá sau)");
    }
  }

  if (email && pw) {
    const user = createClient(url, anonKey, { auth: { persistSession: false } });
    const loginEmail = email.includes("@") ? email : `${email}@wesley.local`;
    const { data: session, error: authErr } = await user.auth.signInWithPassword({
      email: loginEmail, password: pw,
    });
    if (authErr || !session.session) {
      skip(`không đăng nhập được bằng ${email}: ${authErr?.message}`);
    } else {
      const { data: me } = await admin
        .from("app_users").select("role_id,name").eq("auth_id", session.user!.id).maybeSingle();
      if (me?.role_id === "admin" || me?.role_id === "super_admin") {
        skip(`${me?.name} là ${me?.role_id} — cần tài khoản KHÔNG phải admin mới kiểm được`);
      } else {
        const { error } = await user
          .from("site_content")
          .upsert({ id: "site", content: { hacked: true } });
        check(
          !!error,
          `tài khoản '${me?.role_id ?? "?"}' ĐÃ ĐĂNG NHẬP vẫn KHÔNG ghi được site_content${error ? ` (${error.code ?? ""})` : " ← GHI ĐƯỢC, LỖ HỔNG VẪN CÒN!"}`,
        );
      }
      await user.auth.signOut();
    }
  }

  if (tempAuthId) {
    await admin.from("app_users").delete().eq("auth_id", tempAuthId);
    await admin.auth.admin.deleteUser(tempAuthId);
    const { count } = await admin
      .from("app_users").select("*", { count: "exact", head: true }).eq("auth_id", tempAuthId);
    check(count === 0, `đã xoá tài khoản tạm (còn ${count} dòng app_users)`);
  }
}

// ── 4. service-role (the path the admin-gated action takes) still works ──
{
  const { error } = await admin
    .from("site_content")
    .upsert({ id: "site", content: original, updated_at: new Date().toISOString() });
  check(!error, `service-role vẫn ghi được — CMS của admin vẫn chạy${error ? `: ${error.message}` : ""}`);
}

// ── content untouched ──
{
  const { data: after } = await admin
    .from("site_content").select("content").eq("id", "site").maybeSingle();
  check(
    JSON.stringify(after?.content ?? {}) === JSON.stringify(original),
    "nội dung website giữ nguyên như trước khi chạy test",
  );
}

console.log(failed ? "\n✗ FAIL" : "\n✓ PASS - chỉ service-role (qua action đã gate admin) mới ghi được site_content");
process.exit(failed ? 1 : 0);
