import type { RoleDef, RoleGroup, ShiftType, StaffRecord } from "@/types/domain";

export interface RosterBand {
  id: string;
  label: string;
  color: string;
  tint: string;
  staff: StaffRecord[];
}

// Band identity + palette for staff whose roles map to no group.
const UNASSIGNED: Omit<RosterBand, "staff"> = {
  id: "__unassigned",
  label: "Unassigned",
  color: "#7a7163",
  tint: "#EFE7D7",
};

// Order staff into roster bands: each staffer lands in the earliest group (by
// sortOrder) that any of their roles belongs to; staff whose roles map to no
// group fall into a trailing "Unassigned" band. Empty bands are dropped. Within
// a band the incoming staff order (alphabetical) is preserved. Bands returned in
// group order carry the display palette for the header row.
export function groupStaffForRoster(
  staff: StaffRecord[],
  roles: RoleDef[],
  groups: RoleGroup[],
): RosterBand[] {
  const groupOrder = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const rank = new Map(groupOrder.map((g, i) => [g.id, i]));
  const roleToGroup = new Map(roles.map((r) => [r.name, r.groupId]));
  const roleOrder = new Map(roles.map((r) => [r.name, r.sortOrder]));

  // A staffer's sort key within a band = the priority of their highest-ranked
  // role that belongs to that group (lowest sortOrder wins, e.g. Registered
  // Nurse above Carer). Staff with no role in the group sort last.
  const orderInGroup = (s: StaffRecord, gid: string): number => {
    let best = Infinity;
    for (const roleName of s.roles) {
      if (roleToGroup.get(roleName) === gid) best = Math.min(best, roleOrder.get(roleName) ?? 0);
    }
    return best;
  };

  // Groups a staffer's roles map to (deduped), in no particular order.
  const eligibleGroups = (s: StaffRecord): string[] => {
    const ids = new Set<string>();
    for (const roleName of s.roles) {
      const gid = roleToGroup.get(roleName);
      if (gid != null && rank.has(gid)) ids.add(gid);
    }
    return [...ids];
  };

  // The group a staffer bands into: an explicit roster-group override wins when
  // it's one of the staffer's eligible groups; otherwise the earliest by sort
  // order. Null when their roles map to no group (→ Unassigned band).
  const bandOf = (s: StaffRecord): string | null => {
    const eligible = eligibleGroups(s);
    if (s.rosterGroupId && eligible.includes(s.rosterGroupId)) return s.rosterGroupId;
    let best: string | null = null;
    let bestRank = Infinity;
    for (const gid of eligible) {
      const r = rank.get(gid)!;
      if (r < bestRank) {
        bestRank = r;
        best = gid;
      }
    }
    return best;
  };

  const byGroup = new Map<string, StaffRecord[]>();
  const unassigned: StaffRecord[] = [];
  for (const s of staff) {
    const gid = bandOf(s);
    if (gid == null) {
      unassigned.push(s);
    } else {
      (byGroup.get(gid) ?? byGroup.set(gid, []).get(gid)!).push(s);
    }
  }

  const bands: RosterBand[] = [];
  for (const g of groupOrder) {
    const members = byGroup.get(g.id);
    if (members && members.length) {
      // Order staff by their role priority within this group (stable sort keeps
      // the incoming alphabetical order for staff of equal priority).
      const ordered = [...members].sort((a, b) => orderInGroup(a, g.id) - orderInGroup(b, g.id));
      bands.push({ id: g.id, label: g.label, color: g.color, tint: g.tint, staff: ordered });
    }
  }
  if (unassigned.length) bands.push({ ...UNASSIGNED, staff: unassigned });
  return bands;
}

// The roster cell picker offers a staffer a FLAT list of shifts whose role
// belongs to the same role group(s) they do - the whole group, not just their
// exact role - in the shift list's natural (canonical) order, with no own-role
// prioritisation. Truly roleless shifts (no role at all) are universal; a
// shift whose role has no group (e.g. Team Leader, banded to Unassigned) is
// restricted to that exact role, not offered group-wide or to everyone. A
// staffer who would otherwise see nothing is offered every shift so the cell
// is never un-assignable. Role-group banding of the roster itself lives in
// the grid rows (groupStaffForRoster), not here.
// One role's shift options inside a picker group. `label` is the role name shown
// as the sub-header; "" (a truly roleless shift) renders no sub-header.
export interface RosterPickerRole {
  role: string;
  label: string;
  shifts: ShiftType[];
}

// A picker section: a role group header (`label`) over its roles' shifts. Shifts
// whose role maps to no group fall into a trailing "Unassigned" section; truly
// roleless (universal) shifts fall into a trailing "Any role" section.
export interface RosterPickerGroup {
  key: string;
  label: string;
  roles: RosterPickerRole[];
}

// Synthetic section keys/ranks for shifts that don't map to a real role group.
const UNGROUPED_KEY = "__unassigned";
const ROLELESS_KEY = "__any";

// Fold a staffer's allowed shifts into ordered Group -> Role -> shift sections.
// Groups order by their RoleGroup.sortOrder; the two synthetic sections
// (Unassigned, then Any role) always trail. Roles inside a group order by
// RoleDef.sortOrder; shifts keep their incoming (canonical) order.
function groupPickerShifts(
  allowed: ShiftType[],
  roleToGroup: Map<string, string | null>,
  roleOrder: Map<string, number>,
  groupById: Map<string, RoleGroup>,
): RosterPickerGroup[] {
  const byGroup = new Map<string, Map<string, ShiftType[]>>();
  const meta = new Map<string, { label: string; rank: number }>();

  for (const st of allowed) {
    let key: string, label: string, rank: number;
    if (!st.role) {
      key = ROLELESS_KEY; label = "Any role"; rank = Number.MAX_SAFE_INTEGER;
    } else {
      const gid = roleToGroup.get(st.role) ?? null;
      const g = gid ? groupById.get(gid) : undefined;
      if (g) { key = g.id; label = g.label; rank = g.sortOrder; }
      else { key = UNGROUPED_KEY; label = "Unassigned"; rank = Number.MAX_SAFE_INTEGER - 1; }
    }
    if (!meta.has(key)) meta.set(key, { label, rank });
    const roleMap = byGroup.get(key) ?? byGroup.set(key, new Map()).get(key)!;
    (roleMap.get(st.role) ?? roleMap.set(st.role, []).get(st.role)!).push(st);
  }

  return [...byGroup.entries()]
    .sort((a, b) => meta.get(a[0])!.rank - meta.get(b[0])!.rank)
    .map(([key, roleMap]) => ({
      key,
      label: meta.get(key)!.label,
      roles: [...roleMap.entries()]
        .sort((a, b) => (roleOrder.get(a[0]) ?? 0) - (roleOrder.get(b[0]) ?? 0))
        .map(([role, shifts]) => ({ role, label: role, shifts })),
    }));
}

export function rosterPickersFor(
  staff: StaffRecord[],
  roles: RoleDef[],
  shiftTypes: ShiftType[],
  groups: RoleGroup[],
): Record<string, RosterPickerGroup[]> {
  const roleToGroup = new Map(roles.map((r) => [r.name, r.groupId]));
  const roleOrder = new Map(roles.map((r) => [r.name, r.sortOrder]));
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const pickers: Record<string, RosterPickerGroup[]> = {};
  for (const s of staff) {
    const myGroups = new Set(
      s.roles.map((r) => roleToGroup.get(r)).filter((g): g is string => g != null),
    );
    const allowed = shiftTypes.filter((st) => {
      if (!st.role) return true; // no role at all - genuinely unrestricted
      const g = roleToGroup.get(st.role);
      // Grouped role -> offered to the whole group. Ungrouped role (e.g. Team
      // Leader, banded to Unassigned) -> that exact role only, so the shift
      // doesn't leak to every other staffer just because its role has no group.
      return g != null ? myGroups.has(g) : s.roles.includes(st.role);
    });
    pickers[s.id] = groupPickerShifts(
      allowed.length ? allowed : shiftTypes,
      roleToGroup, roleOrder, groupById,
    );
  }
  return pickers;
}
