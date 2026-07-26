/**
 * Emits paste-ready SQL for The Lodge: its 22 rooms plus the residents living in
 * them. REFUSES to emit if the source data doesn't check out.
 *
 * Transcribed verbatim from the register supplied by the home (NZ dates,
 * DD/MM/YYYY). The spreadsheet export wrapped some cells in quotes and padding;
 * only that formatting noise is stripped - no value is corrected. Rows that look
 * wrong are reported, and where they can't be represented safely the script
 * exits rather than writing a guess into a clinical record.
 *
 * Unlike Wesley (whose rooms ship in migration 0027) The Lodge has no rooms in
 * the database yet, so this also seeds `rooms`. A register line with a room but
 * no name is a vacant room: the room is created, no resident is.
 *
 * Checks: NHI format + uniqueness, room exists in the register below, dates
 * parse and are sane (admitted after birth, not in the future). A room holding
 * more than one resident is reported for confirmation, not assumed.
 *
 * Run: npx tsx scripts/db/emit-lodge-rooms-and-residents-seed-sql.mts
 * Output: supabase/seed/0008_lodge_rooms_and_residents.sql
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// name | room | dob | admitted | nhi | gender | group | phone
// An empty name means the register lists the room with nobody in it.
const RAW = `
Steven Kerr|1B|16/06/1959|3/6/2026|FVJ3907||Western|
|2B|||||||
Barry John|3B|25/09/1958|18/05/2026|CZM1347|M|Western|
Richard Cotter|4B|29/01/1953|22/05/2026|QCV1349|M|Western|
Zane Mendoza|5B|29/03/1979|15/03/2024|BKS1550|M|Western|
|6B|||||||
David Holland|7B|29/12/1954|03/06/2024|APR8936|M|Western|0221016147
|8B|||||||
Patrick James|9B|2/9/1960|13/07/2026|SJH1771|M|Western|
Andrea Surplis|10B|18/08/1946|15/12/2025||F|Western|0212560861
James Surplis|10B|13/12/1954|19/09/2025|GQT4865|M|Western|0272954697
|1A|||||||
Yinye|2A|14/10/1937|12/6/2026|RTT4489|F|Asian|
Yaoyu|3A|13/03/1938|21/07/2026|SMB1888|M|Asian|
Huang Ying|4A|4/10/1939|12/3/2026|MFL2527||Asian|
Lanying|5A|25/11/1942|21/07/2026|REP3996|F|Asian|
Zuoqiong|6A|14/01/1937|18/06/2026|HWE8593|F|Asian|
Nova Margaret Wolfgramm|7A|23/09/1953|23/09/2024|LQL5604|F|Western|
Bronwyn Wyn|8A|28/12/1951|22/3/2026|AXY3971|F|Western|
Diep Tran|9A|18/06/1970|20/03/2026|EGV7870|F|Asian|
Beverly Anne|10A|16/07/1943|16/06/2026|BSY2208|F|Western|
Fei Yu|11A|22/06/1952|7/5/2026|TUQ8366|F|Asian|
Jude Henderson|12A|27/11/1948|10/4/2026|DYZ3557|F|Western|
`.trim();

// The Lodge's rooms in register order: the B block, then the A block. Order
// drives sort_order, so the portal lists them the way the home reads them.
const ROOMS = `1B 2B 3B 4B 5B 6B 7B 8B 9B 10B
1A 2A 3A 4A 5A 6A 7A 8A 9A 10A 11A 12A`.split(/\s+/);

/** NZ NHI: 3 letters then 4 chars (older ends in a digit, newer in a letter). */
const NHI_RE = /^[A-Z]{3}[0-9]{3}[0-9A-Z]$/;

/** DD/MM/YYYY -> ISO. Returns null when the parts don't form a real date. */
function toISO(raw: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const [, d, mo, y] = m.map(Number) as unknown as [string, number, number, number];
  const dt = new Date(y, mo - 1, d);
  // Rejects 31/02 and friends, which Date would silently roll forward.
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const initials = (name: string) =>
  name.replace(/\(.*?\)/g, " ").split(/\s+/).filter(Boolean)
    .map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const slugify = (s: string) =>
  s.toLowerCase().replace(/\(.*?\)/g, " ").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const PALETTE = ["#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#c08a3e", "#9a7b4f", "#7e9b6a", "#b06a5a", "#6e879e", "#2C3563", "#B88A34"];
const colorFor = (name: string) =>
  PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

interface Row {
  no: number; name: string; pref: string; room: string;
  dob: string; admitted: string; nhi: string; gender: string; group: string; phone: string;
}

const errors: string[] = [];
const warnings: string[] = [];
const rows: Row[] = [];
const vacant: string[] = [];
const seenNhi = new Map<string, string>();
const seenRoom = new Map<string, string>();
const TODAY = "2026-07-27";

RAW.split("\n").forEach((line, i) => {
  const no = i + 1;
  const [rawName, room, dobRaw, admRaw, nhiRaw, gender, group, phone] =
    line.split("|").map((f) => f.trim());

  if (!ROOMS.includes(room)) {
    errors.push(`#${no}: phòng '${room}' không có trong sổ đăng ký của The Lodge`);
    return;
  }

  // Room listed with nobody in it: seed the room, no resident.
  if (!rawName) {
    vacant.push(room);
    return;
  }

  // "Ik Lie Chang (Minah)" -> preferred name in brackets.
  const bracket = /\(([^)]+)\)/.exec(rawName);
  const name = rawName.replace(/\s*\([^)]*\)\s*/, " ").trim();
  const pref = bracket ? bracket[1].trim() : "";

  const nhi = nhiRaw.toUpperCase();
  if (!nhi) {
    warnings.push(`#${no} ${name}: CHƯA CÓ NHI (sổ ghi "not yet") — để trống, không bịa`);
  } else {
    if (!NHI_RE.test(nhi)) errors.push(`#${no} ${name}: NHI '${nhiRaw}' sai định dạng`);
    const nhiDup = seenNhi.get(nhi);
    if (nhiDup) errors.push(`#${no} ${name}: NHI '${nhi}' trùng với ${nhiDup}`);
    seenNhi.set(nhi, name);
  }

  // Two people in one room is real at The Lodge (a couple), so it is reported
  // for confirmation instead of assumed to be a transcription slip.
  const roomMate = seenRoom.get(room);
  if (roomMate) warnings.push(`#${no} ${name}: Ở CHUNG phòng '${room}' với ${roomMate} — xác nhận đúng là 2 người 1 phòng`);
  seenRoom.set(room, roomMate ? `${roomMate} + ${name}` : name);

  const dob = toISO(dobRaw);
  const admitted = toISO(admRaw);
  if (!dob) errors.push(`#${no} ${name}: ngày sinh '${dobRaw}' không hợp lệ`);
  if (!admitted) errors.push(`#${no} ${name}: ngày nhập viện '${admRaw}' không hợp lệ`);

  if (dob && admitted) {
    if (admitted === dob) warnings.push(`#${no} ${name}: ngày nhập viện TRÙNG ngày sinh (${admRaw}) — nhiều khả năng gõ nhầm`);
    else if (admitted < dob) errors.push(`#${no} ${name}: nhập viện (${admRaw}) trước ngày sinh (${dobRaw})`);
    if (admitted > TODAY) warnings.push(`#${no} ${name}: ngày nhập viện ${admRaw} ở TƯƠNG LAI`);
  }
  if (!gender) warnings.push(`#${no} ${name}: chưa có giới tính`);
  if (name.split(/\s+/).length < 2) warnings.push(`#${no} ${name}: sổ chỉ ghi 1 từ tên — thiếu họ?`);
  if (dob) {
    const age = Number(TODAY.slice(0, 4)) - Number(dob.slice(0, 4));
    if (age < 65) warnings.push(`#${no} ${name}: mới ${age} tuổi (sinh ${dobRaw}) — trẻ bất thường so với phần còn lại`);
  }

  rows.push({ no, name, pref, room, dob: dob ?? "", admitted: admitted ?? "", nhi, gender, group, phone });
});

for (const room of ROOMS) {
  if (!seenRoom.has(room) && !vacant.includes(room)) {
    warnings.push(`phòng '${room}' có trong sổ đăng ký nhưng không có dòng nào — sẽ tạo phòng, để trống`);
  }
}

if (warnings.length) {
  console.log("⚠ CẦN BẠN XÁC NHẬN (vẫn xuất SQL, nhưng nên kiểm lại nguồn):");
  for (const w of warnings) console.log(`   ${w}`);
  console.log();
}
if (errors.length) {
  console.error("✗ KHÔNG xuất SQL — dữ liệu nguồn có lỗi phải sửa trước:");
  for (const e of errors) console.error(`   ${e}`);
  process.exit(1);
}

const q = (v: string) => (v ? `'${v.replace(/'/g, "''")}'` : "null");
const occupied = rows.map((r) => r.room);
const sql: string[] = [
  `-- The Lodge: ${ROOMS.length} rooms and the ${rows.length} residents in them,`,
  "-- transcribed from the home's register.",
  "-- Generated by scripts/db/emit-lodge-rooms-and-residents-seed-sql.mts - do not edit by hand.",
  "-- Building is 'lodge' throughout; Wesley's rows are untouched.",
  "-- Idempotent: rooms keyed on (building_id, num), residents on (building_id, slug).",
  "",
  "-- Rooms in register order (B block, then A block). Re-running only refreshes",
  "-- sort_order; a wing/care_type/status set later is never cleared.",
  "insert into public.rooms (building_id, num, sort_order) values",
  ROOMS.map((num, i) => `  ('lodge', '${num}', ${i * 10})`).join(",\n") + "",
  "on conflict (building_id, num) do update set sort_order = excluded.sort_order;",
  "",
];
for (const r of rows) {
  sql.push(
    `insert into public.residents (building_id, slug, name, pref, room, avatar, color, dob, admitted_on, nhi, gender, resident_group, phone) values ` +
      `('lodge', ${q(slugify(r.name))}, ${q(r.name)}, ${q(r.pref)}, ${q(r.room)}, ${q(initials(r.name))}, ${q(colorFor(r.name))}, ` +
      `${q(r.dob)}, ${q(r.admitted)}, ${q(r.nhi)}, ${q(r.gender)}, ${q(r.group)}, ${q(r.phone)}) ` +
      `on conflict (building_id, slug) do update set name = excluded.name, pref = excluded.pref, room = excluded.room, ` +
      `dob = excluded.dob, admitted_on = excluded.admitted_on, nhi = excluded.nhi, gender = excluded.gender, ` +
      `resident_group = excluded.resident_group, phone = excluded.phone;`,
  );
}
sql.push(
  "",
  "-- Rooms with someone in them read Occupied. The rooms the register lists with",
  `-- nobody in them (${vacant.join(", ")}) keep the Available default.`,
  `update public.rooms set status = 'Occupied' where building_id = 'lodge' and num in (${[...new Set(occupied)].map((n) => `'${n}'`).join(",")});`,
  "",
  "select count(*) as lodge_rooms from public.rooms where building_id = 'lodge';",
  "select count(*) as lodge_residents from public.residents where building_id = 'lodge';",
);

const dest = join(root, "supabase/seed/0008_lodge_rooms_and_residents.sql");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, sql.join("\n") + "\n");
console.log(`✓ ${ROOMS.length} phòng · ${rows.length} resident hợp lệ · ${seenRoom.size} phòng có người · ${vacant.length} phòng trống (${vacant.join(", ")}) · ${seenNhi.size} NHI khác nhau`);
console.log(`  SQL → ${dest}`);
