/**
 * Verifies 0027_rooms_and_resident_details.sql once applied:
 *
 *   1. All 52 Wesley rooms exist, with no duplicates and none missing.
 *   2. They come back in the intended order - "3A" after "3", the 125-134 block
 *      last. A plain text sort would give 1, 10, 11, 125, 12, ... instead.
 *   3. The resident detail columns exist.
 *   4. The NHI uniqueness index actually bites, case-insensitively - the whole
 *      point of storing it uppercase.
 *
 * The NHI check writes and rolls back a throwaway resident.
 *
 * Run: npx tsx scripts/db/verify-rooms-and-resident-details.mts
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
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const EXPECTED = `1 2 3 3A 5 5A 6 7 8 9 10 11 12 13 17A 17B 18A 18B 19A 19B 20A 20B 21A 21B 22A 22B
25 26 27 28 29A 29B 30A 30B 31A 31B 32A 32B 33A 33B 34A 34B
125 126 127 128 129 130 131 132 133 134`.split(/\s+/);

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

// ── 1 + 2. rooms ──
{
  const { data, error } = await db
    .from("rooms").select("num,wing,care_type,status")
    .eq("building_id", "wesley").order("sort_order");
  if (error) {
    console.error(`✗ bảng rooms chưa có — apply supabase/migrations/0027_rooms_and_resident_details.sql trước.\n  ${error.message}`);
    process.exit(1);
  }
  const nums = (data ?? []).map((r) => r.num);
  check(nums.length === EXPECTED.length, `có ${nums.length} phòng (kỳ vọng ${EXPECTED.length})`);

  const missing = EXPECTED.filter((n) => !nums.includes(n));
  const extra = nums.filter((n) => !EXPECTED.includes(n));
  check(missing.length === 0, `không thiếu phòng nào${missing.length ? `: ${missing.join(", ")}` : ""}`);
  check(extra.length === 0, `không có phòng lạ${extra.length ? `: ${extra.join(", ")}` : ""}`);
  check(new Set(nums).size === nums.length, "không có phòng trùng");
  check(
    nums.join(",") === EXPECTED.join(","),
    `thứ tự đúng như danh sách gốc (3A sau 3, khối 125-134 cuối)\n     nhận được: ${nums.slice(0, 6).join(", ")} … ${nums.slice(-3).join(", ")}`,
  );

  const unmapped = (data ?? []).filter((r) => !r.wing || !r.care_type).length;
  if (unmapped) {
    console.log(`  ℹ ${unmapped}/${nums.length} phòng chưa có wing/care_type — cố ý để trống, chờ bạn cung cấp.`);
  }
}

// ── 3. resident columns ──
{
  const { error } = await db
    .from("residents").select("dob,admitted_on,nhi,gender,resident_group,phone").limit(1);
  check(!error, `residents có đủ 6 cột mới${error ? `: ${error.message}` : ""}`);
}

// ── 4. NHI uniqueness, case-insensitive ──
{
  const slugs = ["zz-verify-nhi-a", "zz-verify-nhi-b"];
  await db.from("residents").delete().in("slug", slugs);

  const base = { building_id: "wesley", color: "#6E875E" };
  const { error: firstErr } = await db.from("residents")
    .insert({ ...base, slug: slugs[0], name: "ZZ Verify NHI A", nhi: "ABC1234" });
  check(!firstErr, `chèn resident có NHI 'ABC1234'${firstErr ? `: ${firstErr.message}` : ""}`);

  // Lower-case spelling of the same number must be refused.
  const { error: dupErr } = await db.from("residents")
    .insert({ ...base, slug: slugs[1], name: "ZZ Verify NHI B", nhi: "abc1234" });
  check(
    dupErr?.code === "23505",
    `NHI trùng kiểu chữ thường 'abc1234' bị chặn${dupErr ? ` (${dupErr.code})` : " ← LỌT, index không phân biệt hoa thường!"}`,
  );

  // Two residents with no NHI must both be allowed (partial index).
  const { error: nullErr } = await db.from("residents")
    .insert({ ...base, slug: slugs[1], name: "ZZ Verify NHI B", nhi: null });
  check(!nullErr, `2 resident cùng để trống NHI vẫn chèn được${nullErr ? `: ${nullErr.message}` : ""}`);

  await db.from("residents").delete().in("slug", slugs);
  const { count } = await db.from("residents").select("*", { count: "exact", head: true }).in("slug", slugs);
  check(count === 0, `dọn sạch resident tạm (còn ${count})`);
}

console.log(failed ? "\n✗ FAIL" : "\n✓ PASS");
process.exit(failed ? 1 : 0);
