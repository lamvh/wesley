/**
 * Confirms The Lodge's register landed correctly and that adding a second home
 * did not disturb Wesley or blur the two together.
 *
 * Checks: room + resident counts per home; the 3A/5A numbers that exist in BOTH
 * registers resolve to the right resident per home; 10B holds the couple; the
 * vacant rooms stay Available; no resident slug is shared across homes (every
 * read and write in the app keys on the slug alone).
 *
 * Run: npx tsx scripts/db/verify-lodge-rooms-and-residents.mts
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

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const rooms = await supabase.from("rooms").select("building_id,num,status,sort_order");
  const residents = await supabase.from("residents").select("slug,building_id,name,room,dob,nhi");
  if (rooms.error) throw new Error(rooms.error.message);
  if (residents.error) throw new Error(residents.error.message);

  const roomsOf = (b: string) => rooms.data!.filter((r) => r.building_id === b);
  const residentsOf = (b: string) => residents.data!.filter((r) => r.building_id === b);
  const inRoom = (b: string, num: string) =>
    residentsOf(b).filter((r) => r.room === num).map((r) => r.name).sort();

  console.log("The Lodge register:");
  check("22 phòng", roomsOf("lodge").length === 22, `thấy ${roomsOf("lodge").length}`);
  check("19 resident", residentsOf("lodge").length === 19, `thấy ${residentsOf("lodge").length}`);

  console.log("Wesley không bị ảnh hưởng:");
  check("vẫn 52 phòng", roomsOf("wesley").length === 52, `thấy ${roomsOf("wesley").length}`);
  check("vẫn 52 resident", residentsOf("wesley").length === 52, `thấy ${residentsOf("wesley").length}`);

  console.log("Số phòng trùng giữa 2 toà nhà trả về đúng người:");
  for (const num of ["3A", "5A"]) {
    const w = inRoom("wesley", num);
    const l = inRoom("lodge", num);
    check(
      `phòng ${num}: Wesley = ${w.join(", ") || "(trống)"} · Lodge = ${l.join(", ") || "(trống)"}`,
      w.length === 1 && l.length === 1 && w[0] !== l[0],
      "phải là 2 người khác nhau, mỗi toà nhà 1 người",
    );
  }

  console.log("Phòng đôi và phòng trống:");
  const couple = inRoom("lodge", "10B");
  check(`10B có 2 người (${couple.join(" + ")})`, couple.length === 2, `thấy ${couple.length}`);
  for (const num of ["2B", "6B", "8B", "1A"]) {
    const room = roomsOf("lodge").find((r) => r.num === num);
    check(
      `${num} trống và đang Available`,
      inRoom("lodge", num).length === 0 && room?.status === "Available",
      `status = ${room?.status}`,
    );
  }

  console.log("Slug không trùng giữa 2 toà nhà (app khoá theo slug đơn lẻ):");
  const bySlug = new Map<string, string[]>();
  for (const r of residents.data!) {
    bySlug.set(r.slug, [...(bySlug.get(r.slug) ?? []), r.building_id]);
  }
  const shared = [...bySlug.entries()].filter(([, homes]) => homes.length > 1);
  check("0 slug dùng ở cả 2 toà nhà", shared.length === 0, shared.map(([s]) => s).join(", "));

  console.log("Thứ tự phòng (sort_order) của The Lodge:");
  const ordered = roomsOf("lodge").sort((a, b) => a.sort_order - b.sort_order).map((r) => r.num);
  check(
    `bắt đầu bằng khối B, kết thúc bằng 12A (${ordered[0]} … ${ordered[ordered.length - 1]})`,
    ordered[0] === "1B" && ordered[ordered.length - 1] === "12A",
  );

  console.log(`\n${pass} PASS · ${fail} FAIL`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
