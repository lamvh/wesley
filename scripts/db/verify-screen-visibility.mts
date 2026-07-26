/**
 * Verifies the screen on/off switch (0029_screen_visibility.sql).
 *
 * The claim being tested is that switching a screen off is a real off, not a
 * hidden link, and that only a super_admin can flip it:
 *
 *   1. Meals & dietary is currently parked (the state seeded by 0010).
 *   2. any signed-in session can READ the table - the nav renders on every
 *      portal request and must not fall back to "nothing hidden".
 *   3. a signed-in session CANNOT write it. This is the whole gate: the server
 *      action uses the service-role client, so if RLS let ordinary sessions
 *      write, any logged-in staff member could switch screens off for the
 *      whole site.
 *   4. anon cannot read or write it.
 *   5. the service-role client (what the action uses) can still write, so the
 *      switch actually works.
 *   6. the dashboard and Settings are refused by the app-layer guard, so a bad
 *      row can't strand a super_admin with no way back to the switch.
 *
 * Restores whatever it changes. Checks (2) and (3) need a login; pass one as
 * arguments, otherwise they are reported as skipped rather than passed.
 *
 * Run: npx tsx scripts/db/verify-screen-visibility.mts [identifier] [password]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ALWAYS_VISIBLE, hideableScreens } from "../../src/lib/portal-nav.ts";

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

const PROBE = "/portal/activities"; // a real hideable screen, restored below

// 1. The seeded state.
const { data: meals } = await admin
  .from("screen_visibility").select("hidden").eq("href", "/portal/meals").maybeSingle();
check(meals?.hidden === true, "Meals & dietary đang được ẩn (seed 0010)");

// 2 + 3. A signed-in, non-service-role session.
const [identifier, password] = process.argv.slice(2);
if (identifier && password) {
  const user = createClient(url, anonKey, { auth: { persistSession: false } });
  const email = identifier.includes("@") ? identifier : undefined;
  if (!email) {
    const { data: row } = await admin
      .from("app_users").select("email").eq("username", identifier).maybeSingle();
    if (row?.email) {
      const { error } = await user.auth.signInWithPassword({ email: row.email, password });
      if (error) skip(`không đăng nhập được: ${error.message}`);
    } else {
      skip(`không tìm thấy tài khoản "${identifier}"`);
    }
  } else {
    const { error } = await user.auth.signInWithPassword({ email, password });
    if (error) skip(`không đăng nhập được: ${error.message}`);
  }

  const { data: session } = await user.auth.getSession();
  if (session.session) {
    const { data: readRows, error: readErr } = await user.from("screen_visibility").select("href");
    check(!readErr && Array.isArray(readRows), "session đã đăng nhập ĐỌC được screen_visibility");

    const { error: writeErr } = await user
      .from("screen_visibility").upsert({ href: PROBE, hidden: true }, { onConflict: "href" });
    check(Boolean(writeErr), `session đã đăng nhập KHÔNG ghi được (${writeErr?.code ?? "không có lỗi — RỦI RO"})`);
  } else {
    skip("không có session — bỏ qua kiểm tra đọc/ghi của người dùng thường");
  }
} else {
  skip("chưa truyền tài khoản đăng nhập — bỏ qua kiểm tra đọc/ghi của người dùng thường");
}

// 4. Anonymous.
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data: anonRead } = await anon.from("screen_visibility").select("href");
check((anonRead?.length ?? 0) === 0, "anon không đọc được screen_visibility");
const { error: anonWrite } = await anon
  .from("screen_visibility").upsert({ href: PROBE, hidden: true }, { onConflict: "href" });
check(Boolean(anonWrite), "anon không ghi được screen_visibility");

// 5. Service role - what the admin-gated action uses.
const { error: svcWrite } = await admin
  .from("screen_visibility").upsert({ href: PROBE, hidden: true }, { onConflict: "href" });
check(!svcWrite, "service-role ghi được (công tắc hoạt động)");
const { data: probeRow } = await admin
  .from("screen_visibility").select("hidden").eq("href", PROBE).maybeSingle();
check(probeRow?.hidden === true, `${PROBE} đã chuyển sang ẩn`);
await admin.from("screen_visibility").delete().eq("href", PROBE);
const { data: gone } = await admin
  .from("screen_visibility").select("href").eq("href", PROBE).maybeSingle();
check(gone === null, `${PROBE} bật lại được (xoá dòng = hiện)`);

// 6. App-layer guard: the two screens that must never be hideable.
const hideable = hideableScreens().map((s) => s.href);
check(
  ALWAYS_VISIBLE.every((href) => !hideable.includes(href)),
  `Dashboard và Settings không nằm trong danh sách ẩn được (${ALWAYS_VISIBLE.join(", ")})`,
);
check(hideable.includes("/portal/meals"), "Meals & dietary nằm trong danh sách ẩn được");

console.log(failed ? "\nCÓ KIỂM TRA THẤT BẠI" : "\nTẤT CẢ ĐỀU PASS");
process.exit(failed ? 1 : 0);
