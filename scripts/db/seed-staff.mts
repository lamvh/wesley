/**
 * Applies supabase/migrations/0003_staff_admin.sql then backfills the 10
 * already-seeded staff with employment + leave-balance fields, upserts
 * shift_templates, and reseeds leave_requests (staff_id resolved by name).
 * Run: npx tsx scripts/db/seed-staff.mts   (connects with DIRECT_URL). Idempotent.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
function readEnv(key: string): string | undefined {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}
function pgConfig() {
  const url = readEnv("DIRECT_URL") ?? readEnv("DATABASE_URL");
  if (!url) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");
  const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:/?]+)(?::(\d+))?\/([^?]+)/);
  if (!m) throw new Error("Could not parse DIRECT_URL / DATABASE_URL");
  const [, user, urlPw, host, port, database] = m;
  return { user, password: readEnv("SUPABASE_DB_PASSWORD") ?? urlPw, host,
    port: port ? Number(port) : 5432, database, ssl: { rejectUnauthorized: false as const } };
}
const B = "wesley";

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();
  const ddl = readFileSync(join(root, "supabase/migrations/0003_staff_admin.sql"), "utf8");
  await client.query(ddl);
  const ddlRolePaid = readFileSync(join(root, "supabase/migrations/0008_shift_role_paid_hours.sql"), "utf8");
  await client.query(ddlRolePaid);
  console.log("Schema applied.");

  // Extended fields for the 10 already-seeded staff (match by name).
  const team = [
    { name: "Aroha Ngata",  role: "Registered Nurse", wing: "Rātā",      contract: "Full-time", hours: 40, phone: "021 555 012", start: "Mar 2021", status: "Active",   annual: 20, taken: 6 },
    { name: "David Cho",    role: "Registered Nurse", wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 034", start: "Aug 2020", status: "Active",   annual: 20, taken: 4 },
    { name: "Mere Solomon", role: "Team Leader",      wing: "Rātā",      contract: "Full-time", hours: 38, phone: "021 555 056", start: "Jan 2019", status: "Active",   annual: 20, taken: 12 },
    { name: "Tomasi Fifita",role: "Carer",            wing: "Kōwhai",    contract: "Full-time", hours: 40, phone: "021 555 078", start: "Feb 2022", status: "Active",   annual: 20, taken: 8 },
    { name: "Hong Le",      role: "Carer",            wing: "Tōtara",    contract: "Part-time", hours: 24, phone: "021 555 090", start: "Jun 2022", status: "Active",   annual: 16, taken: 5 },
    { name: "Candy Tian",   role: "Carer",            wing: "Rātā",      contract: "Part-time", hours: 20, phone: "021 555 102", start: "Sep 2023", status: "On leave", annual: 16, taken: 14 },
    { name: "Priya Nair",   role: "Carer",            wing: "Kōwhai",    contract: "Casual",    hours: 12, phone: "021 555 124", start: "Nov 2023", status: "Active",   annual: 8,  taken: 2 },
    { name: "Grace Lin",    role: "Activities",       wing: "All wings", contract: "Part-time", hours: 24, phone: "021 555 146", start: "Apr 2021", status: "Active",   annual: 16, taken: 7 },
    { name: "Vo Hoang Lam", role: "Carer",            wing: "Tōtara",    contract: "Full-time", hours: 40, phone: "021 555 168", start: "Jul 2022", status: "Active",   annual: 20, taken: 9 },
    { name: "LE Anh Thang", role: "Carer",            wing: "Tōtara",    contract: "Casual",    hours: 10, phone: "021 555 180", start: "Feb 2024", status: "Active",   annual: 8,  taken: 1 },
  ];
  for (const s of team) {
    const r = await client.query(
      `update public.staff set role=$2, wing=$3, contract=$4, hours=$5, phone=$6, start_label=$7, status=$8, annual=$9, taken=$10
       where name=$1 and building_id=$11`,
      [s.name, s.role, s.wing, s.contract, s.hours, s.phone, s.start, s.status, s.annual, s.taken, B]);
    if (r.rowCount === 0) {
      const initials = s.name.split(/\s+/).map((w) => w[0]).slice(0,2).join("").toUpperCase();
      await client.query(
        `insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
         values ($1,$2,$3,$4,$5,'#6E875E',$6,$7,$8,$9,$10,$11,$12)`,
        [B, s.name, s.role, s.wing, initials, s.status, s.contract, s.hours, s.phone, s.start, s.annual, s.taken]);
    }
  }
  const shifts = [
    ["sh1","Morning","6:45 – 15:15",4,4,"#87651A","#FCF4DC","#EAD9A4","Carer",8],
    ["sh2","Morning + Stock","6:45 – 17:15",1,1,"#8A6516","#FBEFC8","#E7CE8A","Care Taker",10],
    ["sh3","Afternoon","14:45 – 22:15",3,2,"#9A4A70","#F7DFEA","#E5B2CB","Carer",7.5],
    ["sh4","Evening (split)","8:30 – 21:00",2,2,"#A24E2A","#F7DDCC","#E8AE88","Registered Nurse",8],
    ["sh5","Night","23:45 – 8:15",2,1,"#3B4E74","#E3E8F5","#B4C1DF","Registered Nurse",8],
    ["sh6","Team Leader","8:00 – 22:45",2,2,"#2C5A6E","#D8EAF0","#9FC5D4","Team Leader",8],
  ];
  for (const [id,name,time,req,filled,c,t,b,role,paid] of shifts) {
    await client.query(
      `insert into public.shift_templates (id, building_id, name, time_label, req, filled, color, tint, border, role, paid_hours)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (id) do update set name=excluded.name, time_label=excluded.time_label, req=excluded.req,
         filled=excluded.filled, color=excluded.color, tint=excluded.tint, border=excluded.border,
         role=excluded.role, paid_hours=excluded.paid_hours`,
      [id,B,name,time,req,filled,c,t,b,role,paid]);
  }
  // leave requests (staff_id resolved by name)
  await client.query(`delete from public.leave_requests where building_id=$1`, [B]);
  const leaves = [
    ["Mere Solomon","Annual leave","2026-07-18","2026-07-25",5,"Pending","Family trip"],
    ["Tomasi Fifita","Shift swap","2026-07-20","2026-07-20",1,"Pending","Swap Sun PM → Ana Reti"],
    ["Priya Nair","Sick leave","2026-07-14","2026-07-14",1,"Pending","Afternoon covered"],
    ["Candy Tian","Annual leave","2026-07-01","2026-07-12",8,"Approved",""],
  ];
  for (const [name,type,from,to,days,status,note] of leaves) {
    await client.query(
      `insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
       select $1, s.id, $3, $4, $5, $6, $7, $8 from public.staff s where s.name=$2 and s.building_id=$1`,
      [B,name,type,from,to,days,status,note]);
  }

  const counts = await client.query(`
    select 'staff' t, count(*) n from public.staff
    union all select 'shift_templates', count(*) from public.shift_templates
    union all select 'leave_requests', count(*) from public.leave_requests order by t`);
  console.table(counts.rows);
  await client.end();
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
