/**
 * Emits paste-ready SQL for Wesley's 52 real residents, and REFUSES to emit if
 * the source data doesn't check out.
 *
 * Everything below is transcribed verbatim from the register supplied by the
 * home. Dates are NZ format (DD/MM/YYYY). Nothing is silently corrected: rows
 * that look wrong are reported and, where they can't be represented safely, the
 * script exits rather than writing a guess into a clinical record.
 *
 * Checks: NHI format + uniqueness, room exists in the register (0027) and is
 * used once, dates parse and are sane (admitted after birth, not in the future).
 *
 * Run: npx tsx scripts/db/emit-wesley-residents-seed-sql.mts
 * Output: supabase/seed/0007_wesley_residents.sql
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// name | room | dob | admitted | nhi | gender | group | phone
const RAW = `
Shihui Zhu|1|20/08/1940|22/06/2024|TKQ3363|F|Asian|0221704620
Jieping Tao|2|02/12/1936|22/06/2024|UCW5271|M|Asian|0224072089
Kenneth Tsang|3|14/12/1970|01/03/2024|LGB7709|M|Asian|021364727
MeiLin Zhu|3A|4/8/1938|13/05/2026|QHL1431|F|Asian|
Shouping Zhang|5|20/07/1946|13/05/2025|TJX9292|F|Asian|
Mai Ngoc Danh|5A|17/09/1948|05/11/2025|FPF0777|F|Asian|
Jinyang Yan|6|31/03/1936|29/07/2025|RAC2584|F|Asian|0225327567
Ian Henderson|7|29/07/1943|23/08/2024|AWB6114|M|Western|0225679917
Dam Van Quang|8|5/10/1944|05/03/2026|RRS1370|M|Asian|
Han Zhong Zhang|9|07/11/1937|10/08/2024|SSC9011|M|Asian|
Qunying Tang|10|31/03/1944|10/08/2024|WSG9883|F|Asian|
Bao-Man Zhang|11|21/09/1943|28/08/2024|TMG1382|M|Asian|0212309950
Zhenping Shi|12|04/09/1945|28/08/2024|TMG1412|F|Asian|
Cheuk-Wing Wong|13|25/11/1939|01/04/2024|LZY1567|M|Asian|0211680515
Ke Wei Wu|17A|15/06/1935|12/01/2026|QZW5515|M|Asian|
Ming Zheng|17B|11/4/1938|12/01/2026|RLN8701|F|Asian|
Chaoshi Zhu|18A|25/06/1936|24/06/2024|QHW3510|M|Asian|
Ouhua Li|18B|26/12/1943|24/06/2024|QFY2965|F|Asian|
Biyue Guo|19A|28/07/1933|14/09/2024|PKK7499|F|Asian|
Yuet Oi Kam Tam|19B|30/11/1937|30/03/2025|PUW8755|F|Asian|0212127882
Ik Lie Chang (Minah)|20A|1/1/1946|25/01/2026|SEX2130|F|Asian|
Yunping Zhao|20B|24/10/1946|26/05/2024|SHD4952|F|Asian|0276263586
Peisong Bao|21A|23/11/1936|01/09/2024|TLD0580|M|Asian|02108485666
Shiming Yu|21B|22/07/1938|27/05/2025|HQK0240|M|Asian|
Shao Ying He|22A|29/11/1936|02/02/2025|NCC6944|F|Asian|
Gui Shan Wang|22B|24/01/1931|02/02/2025|PAF8352|M|Asian|
Mei Sheng Qu|25|01/02/1933|10/07/2024|SAA2889|M|Asian|
Huai Ci Huang|26|20/12/1931|10/07/2024|QLB5334|F|Asian|
Xueyu Chen|27|22/10/1944|22/10/1944|UZP6879|F|Asian|
GuiFu Liu|28|04/09/1937|16/12/2023|VAD5516|M|Asian|
Carolyn Griffin|29A|19/07/1946|25/05/2024|BAB3100|F|Western|
Robin Hooper|29B|5/12/1930|16/12/2025|MMA5120|F|Western|0273421295
Chee Yuan Fu|30A|12/5/1948|28/02/2026|BQL6187||Asian|
Shu Fen Pho|30B|3/7/1959|28/02/2026|BQL6098||Asian|
Thi An Nguyen|31A|14/04/1945|22/02/2025|JDA0511|F|Asian|0223178681
Quang Trung Le|31B|12/12/1937|22/02/2025|SNY3324|M|Asian|0220248616
Fenglin Guo|32A|12/07/1935|22/03/2025|SNL4449|F|Asian|0220525398
Dejiang Liu|32B|13/09/1935|22/03/2025|QQV0444|M|Asian|
Alma Moran|33A|18/06/1947|11/06/2024|DHM8911|F|Western|
HaiYong Zhang|33B|3/9/1934|13/05/2026|HWE7961|M|Asian|
Peiqin Xue|34A|06/05/1945|16/02/2024|STT9697|F|Asian|0226575521
Merrilyn Hardaker|34B|07/01/1942|25/05/2024|CQR4088|F|Western|0272016244
Mohamad Elbougha|125|01/04/1943|06/06/2024|QVV5112|M|Western|0212168451
Zhi Hui Zou|126|27/12/1940|15/12/2025|TQS0619|M|Asian|
Chunzhi Yu|127|21/08/1934|05/05/2024|STJ2529|F|Asian|
Marjorie Winifred Rowe|128|19/06/1947|10/02/2024|MWX7420|F|Western|
Yingmei Gao|129|14/12/1936|15/12/2023|FNM9306|F|Asian|
Ruxuan Chen|130|24/04/1935|16/12/2023|UYX9770|F|Asian|02108759487
Joan Lesley Davidson|131|3/10/1941|16/06/2025|DSM6391|F|Western|0212648118
Qiong Xian Chen|132|9/12/1941|9/2/2026|PJH8988|F|Asian|
Bing Guo|133|27/03/1937|12/7/2025|REH2628|F|Asian|0223574678
Xiaojing Qian|134|7/7/1949|28/08/2025|TAH1272|F|Asian|0225943800
`.trim();

// The 52 rooms seeded by 0027, in register order.
const ROOMS = `1 2 3 3A 5 5A 6 7 8 9 10 11 12 13 17A 17B 18A 18B 19A 19B 20A 20B 21A 21B 22A 22B
25 26 27 28 29A 29B 30A 30B 31A 31B 32A 32B 33A 33B 34A 34B
125 126 127 128 129 130 131 132 133 134`.split(/\s+/);

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
const seenNhi = new Map<string, string>();
const seenRoom = new Map<string, string>();
const TODAY = "2026-07-27";

RAW.split("\n").forEach((line, i) => {
  const no = i + 1;
  const [rawName, room, dobRaw, admRaw, nhiRaw, gender, group, phone] =
    line.split("|").map((f) => f.trim());

  // "Ik Lie Chang (Minah)" -> preferred name in brackets.
  const bracket = /\(([^)]+)\)/.exec(rawName);
  const name = rawName.replace(/\s*\([^)]*\)\s*/, " ").trim();
  const pref = bracket ? bracket[1].trim() : "";

  const nhi = nhiRaw.toUpperCase();
  if (!NHI_RE.test(nhi)) errors.push(`#${no} ${name}: NHI '${nhiRaw}' sai định dạng`);
  const nhiDup = seenNhi.get(nhi);
  if (nhiDup) errors.push(`#${no} ${name}: NHI '${nhi}' trùng với ${nhiDup}`);
  seenNhi.set(nhi, name);

  if (!ROOMS.includes(room)) errors.push(`#${no} ${name}: phòng '${room}' không có trong sổ đăng ký`);
  const roomDup = seenRoom.get(room);
  if (roomDup) errors.push(`#${no} ${name}: phòng '${room}' đã có ${roomDup} ở`);
  seenRoom.set(room, name);

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
  if (dob) {
    const age = Number(TODAY.slice(0, 4)) - Number(dob.slice(0, 4));
    if (age < 65) warnings.push(`#${no} ${name}: mới ${age} tuổi (sinh ${dobRaw}) — trẻ bất thường so với phần còn lại`);
  }

  rows.push({ no, name, pref, room, dob: dob ?? "", admitted: admitted ?? "", nhi, gender, group, phone });
});

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
const sql: string[] = [
  `-- Wesley's ${rows.length} residents, transcribed from the home's register.`,
  "-- Generated by scripts/db/emit-wesley-residents-seed-sql.mts - do not edit by hand.",
  "-- Building is 'wesley' throughout; none of these belong to The Lodge.",
  "-- Idempotent: keyed on (building_id, slug), re-running refreshes the details.",
  "",
];
for (const r of rows) {
  sql.push(
    `insert into public.residents (building_id, slug, name, pref, room, avatar, color, dob, admitted_on, nhi, gender, resident_group, phone) values ` +
      `('wesley', ${q(slugify(r.name))}, ${q(r.name)}, ${q(r.pref)}, ${q(r.room)}, ${q(initials(r.name))}, ${q(colorFor(r.name))}, ` +
      `${q(r.dob)}, ${q(r.admitted)}, ${q(r.nhi)}, ${q(r.gender)}, ${q(r.group)}, ${q(r.phone)}) ` +
      `on conflict (building_id, slug) do update set name = excluded.name, pref = excluded.pref, room = excluded.room, ` +
      `dob = excluded.dob, admitted_on = excluded.admitted_on, nhi = excluded.nhi, gender = excluded.gender, ` +
      `resident_group = excluded.resident_group, phone = excluded.phone;`,
  );
}
sql.push(
  "",
  "-- Every seeded room now reads Occupied.",
  `update public.rooms set status = 'Occupied' where building_id = 'wesley' and num in (${rows.map((r) => `'${r.room}'`).join(",")});`,
  "",
  "select count(*) as wesley_residents from public.residents where building_id = 'wesley';",
);

const dest = join(root, "supabase/seed/0007_wesley_residents.sql");
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, sql.join("\n") + "\n");
console.log(`✓ ${rows.length} resident hợp lệ · ${seenRoom.size} phòng khác nhau · ${seenNhi.size} NHI khác nhau`);
console.log(`  SQL → ${dest}`);
