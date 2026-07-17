/**
 * Exercises the approve_leave RPC directly via pg (no RLS session - mirrors
 * verify-stock-write.mts's connection pattern): inserts a temp staff row
 * (annual 20, taken 0), a Pending 'Annual leave' request for it with
 * days=3, calls approve_leave, and asserts the staffer's taken balance
 * increased by 3 and the request status flipped to 'Approved'. Leaves
 * tables clean.
 * Run: npx tsx scripts/db/verify-staff-write.mts
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
const NAME = "ZZ Verify Staff";

interface StaffRow { id: string; taken: number }
interface LeaveRow { id: string; status: string }

async function main() {
  const client = new pg.Client(pgConfig());
  await client.connect();

  // Clean up any leftovers from a previous aborted run before inserting.
  await client.query(
    `delete from public.leave_requests where staff_id in (select id from public.staff where name=$1 and building_id=$2)`,
    [NAME, B]);
  await client.query(`delete from public.staff where name=$1 and building_id=$2`, [NAME, B]);

  const staff = await client.query<StaffRow>(
    `insert into public.staff (building_id, name, role, wing, initials, contract, hours, phone, status, annual, taken)
     values ($1,$2,'Carer','Rātā','ZV','Full-time',40,null,'Active',20,0)
     returning id, taken`,
    [B, NAME]);
  const staffId = staff.rows[0].id;
  if (staff.rows[0].taken !== 0) throw new Error(`expected taken 0, got ${staff.rows[0].taken}`);
  console.log("✓ temp staff created, taken=0");

  const leave = await client.query<LeaveRow>(
    `insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
     values ($1,$2,'Annual leave', current_date, current_date + 2, 3, 'Pending', 'verify run')
     returning id, status`,
    [B, staffId]);
  const leaveId = leave.rows[0].id;
  if (leave.rows[0].status !== "Pending") throw new Error(`expected Pending, got ${leave.rows[0].status}`);
  console.log("✓ temp leave request created, status=Pending, days=3");

  await client.query(`select public.approve_leave($1)`, [leaveId]);

  const afterStaff = await client.query<StaffRow>(`select id, taken from public.staff where id=$1`, [staffId]);
  if (afterStaff.rows[0].taken !== 3) throw new Error(`expected taken 3 after approve, got ${afterStaff.rows[0].taken}`);
  console.log("✓ approve_leave → staff.taken 0 → 3");

  const afterLeave = await client.query<LeaveRow>(`select id, status from public.leave_requests where id=$1`, [leaveId]);
  if (afterLeave.rows[0].status !== "Approved") throw new Error(`expected Approved, got ${afterLeave.rows[0].status}`);
  console.log("✓ approve_leave → leave_requests.status Approved");

  // cleanup
  await client.query(`delete from public.leave_requests where id=$1`, [leaveId]);
  await client.query(`delete from public.staff where id=$1`, [staffId]);
  await client.end();
  console.log("✓ PASS - approve_leave debits taken and flips status, cleanup done");
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
