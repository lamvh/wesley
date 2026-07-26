/**
 * Exercises the Team-tab filter rules (lib/staff-filtering.ts) against the real
 * staff list, because the interesting cases only exist in live data:
 *
 *   1. group chips cover everyone - no staffer is unreachable from the chips.
 *   2. a staffer with roles in >1 group appears under ALL of them (the roster
 *      picks one band; a directory filter must not hide the other).
 *   3. OR within an axis, AND across axes.
 *   4. facet counts are computed with their own axis lifted, so picking one
 *      group does not zero every other group chip.
 *   5. a chip's count equals the row count you actually get after clicking it.
 *
 * The pure functions are called directly; only the staff rows come from the DB.
 * Read-only. Run: npx tsx scripts/db/verify-staff-team-filters.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  EMPTY_STAFF_FILTER, buildStaffFacets, filterStaff, groupIdsForStaff,
} from "../../src/lib/staff-filtering";
import type { RoleDef, RoleGroup, StaffRecord } from "../../src/types/domain";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

let failed = false;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failed = true;
};

const [{ data: rawStaff }, { data: rawRoles }, { data: rawGroups }] = await Promise.all([
  db.from("staff").select("id,name,role,roles,contract,status").eq("building_id", "wesley"),
  db.from("staff_roles").select("name,group_id,sort_order"),
  db.from("role_groups").select("id,label,color,tint,sort_order").order("sort_order"),
]);

// Only the fields the filter reads are needed; the rest are padded so the
// records still satisfy StaffRecord.
const staff: StaffRecord[] = (rawStaff ?? []).map((r) => ({
  id: r.id, name: r.name, preferredName: "",
  roles: (r.roles ?? (r.role ? [r.role] : [])).filter(Boolean),
  contract: r.contract ?? "", hours: 0, phone: "", start: "",
  status: r.status ?? "Active", initials: "", color: "",
  annual: 0, taken: 0, sick: 0, sickTaken: 0,
  visaType: "", visaExpiry: "", rosterGroupId: null,
}));
const roles: RoleDef[] = (rawRoles ?? []).map((r) => ({
  name: r.name, color: "", tint: "", groupId: r.group_id ?? null,
  sortOrder: r.sort_order ?? 0, hourlyRate: 0,
}));
const groups: RoleGroup[] = (rawGroups ?? []).map((g) => ({
  id: g.id, label: g.label, color: g.color, tint: g.tint, sortOrder: g.sort_order ?? 0,
}));

console.log(`${staff.length} nhân viên · ${roles.length} vai trò · ${groups.length} nhóm\n`);

const groupOfRole = new Map(roles.map((r) => [r.name, r.groupId]));
const facets = buildStaffFacets(staff, roles, groups, EMPTY_STAFF_FILTER, "");

console.log("Nhóm:", facets.groups.map((o) => `${o.label} (${o.count})`).join(", "));
console.log("Trạng thái:", facets.statuses.map((o) => `${o.label} (${o.count})`).join(", "));
console.log("Hợp đồng:", facets.contracts.map((o) => `${o.label} (${o.count})`).join(", "), "\n");

// 1. Everyone is reachable from at least one group chip.
const chipIds = new Set(facets.groups.map((o) => o.value));
const unreachable = staff.filter((s) => !groupIdsForStaff(s, groupOfRole).some((g) => chipIds.has(g)));
check(unreachable.length === 0,
  `mọi nhân viên đều nằm trong ít nhất 1 chip nhóm (lọt: ${unreachable.map((s) => s.name).join(", ") || "0"})`);

// 2. Multi-group staff show under every one of their groups.
const multi = staff.filter((s) => groupIdsForStaff(s, groupOfRole).length > 1);
if (multi.length === 0) {
  console.log(`- BỎ QUA: không ai có vai trò thuộc >1 nhóm, không kiểm được mục này`);
} else {
  const person = multi[0];
  const ids = groupIdsForStaff(person, groupOfRole);
  const inAll = ids.every((id) =>
    filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, groups: [id] }, "").some((s) => s.id === person.id));
  check(inAll, `"${person.name}" (${person.roles.join(" + ")}) hiện ở CẢ ${ids.length} nhóm`);
}

// 3. OR within an axis, AND across axes.
const [g1, g2] = facets.groups;
if (g1 && g2) {
  const or = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, groups: [g1.value, g2.value] }, "");
  const only1 = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, groups: [g1.value] }, "");
  const only2 = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, groups: [g2.value] }, "");
  const union = new Set([...only1, ...only2].map((s) => s.id));
  check(or.length === union.size, `chọn 2 nhóm = hợp của 2 (${or.length} = ${union.size})`);

  const andAxes = filterStaff(staff, roles,
    { ...EMPTY_STAFF_FILTER, groups: [g1.value], statuses: ["Active"] }, "");
  check(andAxes.every((s) => s.status === "Active") && andAxes.length <= only1.length,
    `nhóm "${g1.label}" + trạng thái Active = giao của 2 trục (${andAxes.length} ≤ ${only1.length})`);
}

// 4 + 5. Counts stay meaningful once a chip in the same row is selected, and a
// chip's number is the row count you get after clicking it.
if (g1) {
  const withG1 = { ...EMPTY_STAFF_FILTER, groups: [g1.value] };
  const refaceted = buildStaffFacets(staff, roles, groups, withG1, "");
  const others = refaceted.groups.filter((o) => o.value !== g1.value);
  check(others.some((o) => o.count > 0),
    `chọn "${g1.label}" rồi, các chip nhóm khác vẫn còn số (${others.map((o) => `${o.label}:${o.count}`).join(", ")})`);

  let mismatch = "";
  for (const o of facets.groups) {
    const got = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, groups: [o.value] }, "").length;
    if (got !== o.count) mismatch += ` ${o.label}(chip ${o.count} ≠ thật ${got})`;
  }
  check(mismatch === "", `số trên mỗi chip nhóm = số dòng thật sau khi bấm${mismatch}`);

  let sMismatch = "";
  for (const o of facets.statuses) {
    const got = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, statuses: [o.value] }, "").length;
    if (got !== o.count) sMismatch += ` ${o.label}(chip ${o.count} ≠ thật ${got})`;
  }
  check(sMismatch === "", `số trên mỗi chip trạng thái khớp${sMismatch}`);
}

// Search still composes with the chips.
const q = staff[0]?.name.split(" ")[0] ?? "";
if (q) {
  const both = filterStaff(staff, roles, { ...EMPTY_STAFF_FILTER, statuses: ["Active"] }, q);
  check(both.every((s) => s.status === "Active" && s.name.toLowerCase().includes(q.toLowerCase())),
    `tìm "${q}" + chip Active áp dụng đồng thời (${both.length} kết quả)`);
}

console.log(failed ? "\nCÓ KIỂM TRA THẤT BẠI" : "\nTẤT CẢ ĐỀU PASS");
process.exit(failed ? 1 : 0);
