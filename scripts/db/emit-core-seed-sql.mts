/**
 * Emits a single self-contained SQL file (schema + seed data from the mocks)
 * that can be pasted straight into the Supabase SQL editor - no DB password
 * needed. Output: supabase/seed/0001_core_seed.sql
 *
 * Run: npx tsx scripts/db/emit-core-seed-sql.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { getBuildings } from "@/lib/mock-data/buildings";
import { getResidents } from "@/lib/mock-data/residents";
import { getShifts } from "@/lib/mock-data/staff-shifts";
import { getUsers, getModules, getDefaultPermissions, ROLE_KEYS } from "@/lib/mock-data/users";
import type { StaffMember } from "@/types/domain";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const B = "wesley";

const s = (v: string | null | undefined) =>
  v === null || v === undefined ? "null" : `'${v.replace(/'/g, "''")}'`;
const n = (v: number | null | undefined) => (v === null || v === undefined ? "null" : String(v));
const b = (v: boolean) => (v ? "true" : "false");
const arr = (v: string[]) =>
  v.length ? `array[${v.map((x) => `'${x.replace(/'/g, "''")}'`).join(",")}]::text[]` : `'{}'::text[]`;

const out: string[] = [];
out.push(readFileSync(join(root, "supabase/migrations/0001_core_schema.sql"), "utf8"));
out.push("\n-- ═══════════════════════ SEED DATA ═══════════════════════\n");

// role_permissions
const perms = getDefaultPermissions();
const modules = getModules();
out.push("-- role_permissions (6 roles × 10 modules × 4 actions)");
for (const role of ROLE_KEYS) {
  for (const m of modules) {
    const g = perms[role][m.key];
    for (const action of ["view", "create", "edit", "delete"] as const) {
      out.push(
        `insert into public.role_permissions (role_id, module, action, granted) values (${s(role)},${s(m.key)},${s(action)},${b(g[action])}) on conflict (role_id, module, action) do update set granted = excluded.granted;`,
      );
    }
  }
}

// buildings + wings
out.push("\n-- buildings + wings");
for (const bl of getBuildings()) {
  out.push(
    `insert into public.buildings (id, name, full_name, suburb, manager_name, color, tint) values (${s(bl.id)},${s(bl.name)},${s(bl.full)},${s(bl.suburb)},${s(bl.mgr)},${s(bl.color)},${s(bl.tint)}) on conflict (id) do update set name=excluded.name, full_name=excluded.full_name, suburb=excluded.suburb, manager_name=excluded.manager_name, color=excluded.color, tint=excluded.tint;`,
  );
  for (const w of bl.wings) {
    out.push(
      `insert into public.building_wings (building_id, name) values (${s(bl.id)},${s(w)}) on conflict (building_id, name) do nothing;`,
    );
  }
}

// app_users
out.push("\n-- app_users (role assignment)");
for (const u of getUsers()) {
  out.push(
    `insert into public.app_users (name, email, role_id, building_id, scope, status) values (${s(u.name)},${s(u.email)},${s(u.role)},${s(B)},${s(u.scope)},${s(u.status)}) on conflict (email) do update set name=excluded.name, role_id=excluded.role_id, building_id=excluded.building_id, scope=excluded.scope, status=excluded.status;`,
  );
}

// project owner - super admin, linked to the auth account by email
out.push("\n-- project owner (super_admin)");
out.push(
  `insert into public.app_users (auth_id, name, email, role_id, building_id, scope, status) values ((select id from auth.users where email = 'vhlam1997@gmail.com'), 'lamvh', 'vhlam1997@gmail.com', 'super_admin', null, 'System', 'Active') on conflict (email) do update set name=excluded.name, role_id='super_admin', status='Active', auth_id=coalesce(app_users.auth_id, excluded.auth_id);`,
);

// staff (dedup across shifts)
out.push("\n-- staff");
const seen = new Set<string>();
const staff: StaffMember[] = [];
for (const shift of getShifts())
  for (const st of shift.staff) if (!seen.has(st.name)) (seen.add(st.name), staff.push(st));
for (const st of staff) {
  out.push(
    `insert into public.staff (building_id, name, role, wing, initials, color) select ${s(B)},${s(st.name)},${s(st.role)},${s(st.wing)},${s(st.initials)},${s(st.color)} where not exists (select 1 from public.staff where name=${s(st.name)} and building_id=${s(B)});`,
  );
}

// residents
out.push("\n-- residents");
for (const r of getResidents()) {
  out.push(
    `insert into public.residents (building_id, slug, name, pref, room, wing, care_type, age, diet, mobility, gp, avatar, color, note, flags) values (${s(B)},${s(r.slug)},${s(r.name)},${s(r.pref)},${s(r.room)},${s(r.wing)},${s(r.careType)},${n(r.age)},${s(r.diet)},${s(r.mobility)},${s(r.gp)},${s(r.avatar)},${s(r.color)},${s(r.note)},${arr(r.flags)}) on conflict (building_id, slug) do update set name=excluded.name, pref=excluded.pref, room=excluded.room, wing=excluded.wing, care_type=excluded.care_type, age=excluded.age, diet=excluded.diet, mobility=excluded.mobility, gp=excluded.gp, avatar=excluded.avatar, color=excluded.color, note=excluded.note, flags=excluded.flags;`,
  );
}

mkdirSync(join(root, "supabase/seed"), { recursive: true });
const dest = join(root, "supabase/seed/0001_core_seed.sql");
writeFileSync(dest, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${dest} (${out.length} lines)`);
