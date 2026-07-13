/**
 * Applies supabase/migrations/0001_core_schema.sql then seeds the tables from
 * the existing mock data so the app has real rows to manage immediately.
 *
 * Run: npx tsx scripts/db/seed-core-schema.mts
 * Connects with DIRECT_URL (or DATABASE_URL) from .env.local. Idempotent.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

import { getBuildings } from "@/lib/mock-data/buildings";
import { getResidents } from "@/lib/mock-data/residents";
import { getShifts } from "@/lib/mock-data/staff-shifts";
import { getUsers, getModules, getDefaultPermissions, ROLE_KEYS } from "@/lib/mock-data/users";
import type { StaffMember } from "@/types/domain";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function readEnv(key: string): string | undefined {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return undefined;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const connectionString = readEnv("DIRECT_URL") ?? readEnv("DATABASE_URL");
if (!connectionString) throw new Error("DIRECT_URL / DATABASE_URL missing in .env.local");

const DEFAULT_BUILDING = "wesley";

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected. Applying schema…");

  const ddl = readFileSync(join(root, "supabase/migrations/0001_core_schema.sql"), "utf8");
  await client.query(ddl);
  console.log("Schema applied.");

  // role_permissions — the full 6×10×4 grant matrix (super_admin = allow-all).
  const perms = getDefaultPermissions();
  const modules = getModules();
  let permCount = 0;
  for (const role of ROLE_KEYS) {
    for (const m of modules) {
      const grant = perms[role][m.key];
      for (const action of ["view", "create", "edit", "delete"] as const) {
        await client.query(
          `insert into public.role_permissions (role_id, module, action, granted)
           values ($1,$2,$3,$4)
           on conflict (role_id, module, action) do update set granted = excluded.granted`,
          [role, m.key, action, grant[action]],
        );
        permCount++;
      }
    }
  }

  // buildings + wings
  for (const b of getBuildings()) {
    await client.query(
      `insert into public.buildings (id, name, full_name, suburb, manager_name, color, tint)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do update set
         name = excluded.name, full_name = excluded.full_name, suburb = excluded.suburb,
         manager_name = excluded.manager_name, color = excluded.color, tint = excluded.tint`,
      [b.id, b.name, b.full, b.suburb, b.mgr, b.color, b.tint],
    );
    for (const wing of b.wings) {
      await client.query(
        `insert into public.building_wings (building_id, name) values ($1,$2)
         on conflict (building_id, name) do nothing`,
        [b.id, wing],
      );
    }
  }

  // app_users (role assignment lives here — auth_id linked on first sign-in)
  for (const u of getUsers()) {
    await client.query(
      `insert into public.app_users (name, email, role_id, building_id, scope, status)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (email) do update set
         name = excluded.name, role_id = excluded.role_id,
         building_id = excluded.building_id, scope = excluded.scope, status = excluded.status`,
      [u.name, u.email, u.role, DEFAULT_BUILDING, u.scope, u.status],
    );
  }

  // Project owner — super admin, linked to the Supabase Auth account by email.
  await client.query(
    `insert into public.app_users (auth_id, name, email, role_id, building_id, scope, status)
     values ((select id from auth.users where email = $2), $1, $2, 'super_admin', null, 'System', 'Active')
     on conflict (email) do update set
       name = excluded.name, role_id = 'super_admin', status = 'Active',
       auth_id = coalesce(app_users.auth_id, excluded.auth_id)`,
    ["lamvh", "vhlam1997@gmail.com"],
  );

  // staff — dedup people across all shifts
  const seen = new Set<string>();
  const staff: StaffMember[] = [];
  for (const shift of getShifts()) {
    for (const s of shift.staff) {
      if (seen.has(s.name)) continue;
      seen.add(s.name);
      staff.push(s);
    }
  }
  for (const s of staff) {
    await client.query(
      `insert into public.staff (building_id, name, role, wing, initials, color)
       select $1,$2,$3,$4,$5,$6
       where not exists (
         select 1 from public.staff where name = $2 and building_id = $1
       )`,
      [DEFAULT_BUILDING, s.name, s.role, s.wing, s.initials, s.color],
    );
  }

  // residents
  for (const r of getResidents()) {
    await client.query(
      `insert into public.residents
         (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       on conflict (building_id, slug) do update set
         name = excluded.name, pref = excluded.pref, room = excluded.room, wing = excluded.wing,
         care_type = excluded.care_type, age = excluded.age, diet = excluded.diet,
         mobility = excluded.mobility, gp = excluded.gp, avatar = excluded.avatar,
         color = excluded.color, note = excluded.note, flags = excluded.flags`,
      [
        DEFAULT_BUILDING, r.slug, r.name, r.pref, r.room, r.wing, r.careType, r.age,
        r.diet, r.mobility, r.gp, r.avatar, r.color, r.note, r.flags,
      ],
    );
  }

  const counts = await client.query(`
    select 'roles' t, count(*) n from public.roles
    union all select 'role_permissions', count(*) from public.role_permissions
    union all select 'buildings', count(*) from public.buildings
    union all select 'building_wings', count(*) from public.building_wings
    union all select 'app_users', count(*) from public.app_users
    union all select 'staff', count(*) from public.staff
    union all select 'residents', count(*) from public.residents
    order by t`);
  console.log(`Seeded ${permCount} permission grants.`);
  console.table(counts.rows);

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
