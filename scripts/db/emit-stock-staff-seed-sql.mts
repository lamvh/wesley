/**
 * Emits paste-ready seed SQL for the Stock (0002) and Staff (0003) features so
 * they can be applied via the Supabase SQL Editor without a local pg connection.
 * Reads the real mock catalog for stock; staff data mirrors the design's staffTeam.
 * Run: npx tsx scripts/db/emit-stock-staff-seed-sql.mts   (no DB needed)
 * Writes: supabase/seed/0002_stock_seed.sql, supabase/seed/0003_staff_seed.sql
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getProviders, getProductCatalog } from "@/lib/mock-data/stock-catalog";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const B = "wesley";
const q = (v: unknown) =>
  v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`;
const n = (v: number) => String(v);
const b = (v: boolean) => (v ? "true" : "false");

// ---------- Stock (0002) ----------
const provRows = getProviders()
  .map((p) => `  (${q(p.id)},${q(B)},${q(p.name)},${q(p.cat)},${q(p.contact)},${q(p.phone)},${q(p.lead)},${q(p.terms)},${b(p.pref)},${q(p.color)},${q(p.tint)})`)
  .join(",\n");
const prodRows = getProductCatalog()
  .map((p) => `  (${q(p.id)},${q(B)},${q(p.name)},${q(p.cat)},${q(p.unit)},${n(p.price)},${q(p.prov)},${n(p.par)})`)
  .join(",\n");
const levelRows = getProductCatalog()
  .map((p) => `  (${q(p.id)},${q(B)},${n(p.qtyNow)})`)
  .join(",\n");

const stockSql = `-- Stock seed — paste in the Supabase SQL Editor AFTER 0002_stock_procurement.sql. Idempotent.
insert into public.providers (id, building_id, name, category, contact_email, phone, lead_time, terms, preferred, color, tint) values
${provRows}
on conflict (id) do update set name=excluded.name, category=excluded.category, contact_email=excluded.contact_email,
  phone=excluded.phone, lead_time=excluded.lead_time, terms=excluded.terms, preferred=excluded.preferred,
  color=excluded.color, tint=excluded.tint;

insert into public.products (id, building_id, name, category, unit, price, provider_id, par) values
${prodRows}
on conflict (id) do update set name=excluded.name, category=excluded.category, unit=excluded.unit,
  price=excluded.price, provider_id=excluded.provider_id, par=excluded.par;

insert into public.stock_levels (product_id, building_id, qty_now) values
${levelRows}
on conflict (product_id, building_id) do update set qty_now=excluded.qty_now, updated_at=now();

delete from public.stock_movements where building_id='wesley';
insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, provider_id, unit_price, note, move_date)
values ('wesley','p9','in',24,62,'carton','freshfields',28.0,'Weekly delivery', current_date - 1);
insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, dests, receiver, note, move_date)
values ('wesley','p1','out',4,4,'box of 100','[{"room":"07","person":"Henry Fitzgerald","qty":4}]'::jsonb,'Mere Rangi','Room resupply', current_date);
`;

// ---------- Staff (0003) ----------
const team = [
  { name: "Aroha Ngata",  role: "Registered Nurse", wing: "Rātā",      contract: "Full-time", hours: 40, phone: "021 555 012", start: "Mar 2021", status: "Active",   annual: 20, taken: 6,  initials: "AN", color: "#6E875E" },
  { name: "David Cho",    role: "Registered Nurse", wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 034", start: "Aug 2020", status: "Active",   annual: 20, taken: 4,  initials: "DC", color: "#8a6ba3" },
  { name: "Mere Solomon", role: "Team Leader",      wing: "Rātā",      contract: "Full-time", hours: 38, phone: "021 555 056", start: "Jan 2019", status: "Active",   annual: 20, taken: 12, initials: "MS", color: "#b06a5a" },
  { name: "Tomasi Fifita",role: "Carer",            wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 078", start: "Feb 2022", status: "Active",   annual: 20, taken: 8,  initials: "TF", color: "#5b8f9a" },
  { name: "Hong Le",      role: "Carer",            wing: "Tōtara",    contract: "Part-time", hours: 24, phone: "021 555 090", start: "Jun 2022", status: "Active",   annual: 16, taken: 5,  initials: "HL", color: "#BE7350" },
  { name: "Candy Tian",   role: "Carer",            wing: "Rātā",      contract: "Part-time", hours: 20, phone: "021 555 102", start: "Sep 2023", status: "On leave", annual: 16, taken: 14, initials: "CT", color: "#c08a3e" },
  { name: "Priya Nair",   role: "Carer",            wing: "Kōwhai",    contract: "Casual",    hours: 12, phone: "021 555 124", start: "Nov 2023", status: "Active",   annual: 8,  taken: 2,  initials: "PN", color: "#7e9b6a" },
  { name: "Grace Lin",    role: "Activities",       wing: "All wings", contract: "Part-time", hours: 24, phone: "021 555 146", start: "Apr 2021", status: "Active",   annual: 16, taken: 7,  initials: "GL", color: "#9a7b4f" },
  { name: "Vo Hoang Lam", role: "Carer",            wing: "Tōtara",    contract: "Full-time", hours: 40, phone: "021 555 168", start: "Jul 2022", status: "Active",   annual: 20, taken: 9,  initials: "VL", color: "#6e879e" },
  { name: "LE Anh Thang", role: "Carer",            wing: "Tōtara",    contract: "Casual",    hours: 10, phone: "021 555 180", start: "Feb 2024", status: "Active",   annual: 8,  taken: 1,  initials: "AT", color: "#3d6b74" },
];
const shifts = [
  ["sh1","Morning","6:45 – 15:15",4,4,"#87651A","#FCF4DC","#EAD9A4"],
  ["sh2","Morning + Stock","6:45 – 17:15",1,1,"#8A6516","#FBEFC8","#E7CE8A"],
  ["sh3","Afternoon","14:45 – 22:15",3,2,"#9A4A70","#F7DFEA","#E5B2CB"],
  ["sh4","Evening (split)","8:30 – 21:00",2,2,"#A24E2A","#F7DDCC","#E8AE88"],
  ["sh5","Night","23:45 – 8:15",2,1,"#3B4E74","#E3E8F5","#B4C1DF"],
  ["sh6","Team Leader","8:00 – 22:45",2,2,"#2C5A6E","#D8EAF0","#9FC5D4"],
] as const;
const leaves = [
  ["Mere Solomon","Annual leave","2026-07-18","2026-07-25",5,"Pending","Family trip"],
  ["Tomasi Fifita","Shift swap","2026-07-20","2026-07-20",1,"Pending","Swap Sun PM → Ana Reti"],
  ["Priya Nair","Sick leave","2026-07-14","2026-07-14",1,"Pending","Afternoon covered"],
  ["Candy Tian","Annual leave","2026-07-01","2026-07-12",8,"Approved",""],
] as const;

// Upsert = insert-if-missing (by name) + update, so all 10 design staff exist with full data.
const staffUpsert = team
  .map((s) => {
    const ins = `insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)\n  select ${q(B)},${q(s.name)},${q(s.role)},${q(s.wing)},${q(s.initials)},${q(s.color)},${q(s.status)},${q(s.contract)},${n(s.hours)},${q(s.phone)},${q(s.start)},${n(s.annual)},${n(s.taken)}\n  where not exists (select 1 from public.staff where name=${q(s.name)} and building_id=${q(B)});`;
    const upd = `update public.staff set role=${q(s.role)}, wing=${q(s.wing)}, contract=${q(s.contract)}, hours=${n(s.hours)}, phone=${q(s.phone)}, start_label=${q(s.start)}, status=${q(s.status)}, annual=${n(s.annual)}, taken=${n(s.taken)}, initials=${q(s.initials)}, color=${q(s.color)} where name=${q(s.name)} and building_id=${q(B)};`;
    return `${ins}\n${upd}`;
  })
  .join("\n");
const designNames = team.map((s) => q(s.name)).join(", ");
const strayDelete = `-- Remove stray core-seed staff not in the design directory (safe: only the Staff screen reads this table).\ndelete from public.staff where building_id=${q(B)} and name not in (${designNames});`;
const shiftRows = shifts
  .map((s) => `  (${q(s[0])},${q(B)},${q(s[1])},${q(s[2])},${n(s[3])},${n(s[4])},${q(s[5])},${q(s[6])},${q(s[7])})`)
  .join(",\n");
const leaveInserts = leaves
  .map((l) => `insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)\n  select ${q(B)}, s.id, ${q(l[1])}, ${q(l[2])}, ${q(l[3])}, ${n(l[4] as number)}, ${q(l[5])}, ${q(l[6])} from public.staff s where s.name=${q(l[0])} and s.building_id=${q(B)};`)
  .join("\n");

const staffSql = `-- Staff seed — paste in the Supabase SQL Editor AFTER 0003_staff_admin.sql.
-- Upsert the design's 10 staff (insert-if-missing + update), then drop stray placeholder staff.
${staffUpsert}

${strayDelete}

insert into public.shift_templates (id, building_id, name, time_label, req, filled, color, tint, border) values
${shiftRows}
on conflict (id) do update set name=excluded.name, time_label=excluded.time_label, req=excluded.req,
  filled=excluded.filled, color=excluded.color, tint=excluded.tint, border=excluded.border;

delete from public.leave_requests where building_id='wesley';
${leaveInserts}
`;

mkdirSync(join(root, "supabase/seed"), { recursive: true });
writeFileSync(join(root, "supabase/seed/0002_stock_seed.sql"), stockSql);
writeFileSync(join(root, "supabase/seed/0003_staff_seed.sql"), staffSql);
console.log("Wrote supabase/seed/0002_stock_seed.sql + 0003_staff_seed.sql");
