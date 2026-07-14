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

// A named section of the roster cell picker: the shifts of a single role, shown
// under that role's name. `id`/`label`/`color` come from the RoleDef ("Other
// shifts" for roleless or unmapped shifts).
export interface RosterPickerGroup {
  id: string;
  label: string;
  color: string;
  shifts: ShiftType[];
}

const OTHER_ROLE: Omit<RosterPickerGroup, "shifts"> = {
  id: "__other",
  label: "Other shifts",
  color: "#7a7163",
};

// The roster cell picker offers a staffer only the shifts of the role group(s)
// they belong to — never other big groups' shifts — split into one section per
// role, each shown under the role's name. The staffer's own-role section(s) lead
// (e.g. a Registered Nurse sees the "Registered Nurse" section first, then the
// group's other roles like Carer/Team Leader). Roleless shifts have no group and
// are universal, so they trail as an "Other" section for everyone. A staffer
// whose roles map to no group falls back to every role so the cell is never
// un-assignable.
export function rosterPickersFor(
  staff: StaffRecord[],
  roles: RoleDef[],
  groups: RoleGroup[],
  shiftTypes: ShiftType[],
): Record<string, RosterPickerGroup[]> {
  const roleToGroup = new Map(roles.map((r) => [r.name, r.groupId]));
  const roleOrder = new Map(roles.map((r) => [r.name, r.sortOrder]));
  const roleMeta = new Map(roles.map((r) => [r.name, r]));
  const groupRank = new Map(groups.map((g) => [g.id, g.sortOrder]));

  // Bucket every shift under its role once (staff-independent); roleless or
  // unmapped shifts collect under the "Other" section.
  const byRole = new Map<string, ShiftType[]>();
  for (const st of shiftTypes) {
    const key = st.role || OTHER_ROLE.id;
    (byRole.get(key) ?? byRole.set(key, []).get(key)!).push(st);
  }
  const realRoleNames = [...byRole.keys()].filter((rk) => rk !== OTHER_ROLE.id);

  const groupRankOf = (roleName: string): number => {
    const gid = roleToGroup.get(roleName);
    return gid != null ? groupRank.get(gid) ?? Infinity : Infinity;
  };

  const pickers: Record<string, RosterPickerGroup[]> = {};
  for (const s of staff) {
    const myRoles = new Set(s.roles);
    const myGroups = new Set(
      s.roles.map((r) => roleToGroup.get(r)).filter((g): g is string => g != null),
    );

    // Only roles inside the staffer's own big group(s); if their roles map to no
    // group, fall back to every role so a cell always has something to pick.
    const mine = realRoleNames.filter((rk) => {
      const gid = roleToGroup.get(rk);
      return gid != null && myGroups.has(gid);
    });
    // Section order: the staffer's own role(s) first, then the group's other
    // roles by big-group order then role order within the group.
    const sectionRoles = (mine.length ? mine : realRoleNames).sort((a, b) => {
      const own = (myRoles.has(b) ? 1 : 0) - (myRoles.has(a) ? 1 : 0);
      if (own !== 0) return own;
      const byGroup = groupRankOf(a) - groupRankOf(b);
      if (byGroup !== 0) return byGroup;
      return (roleOrder.get(a) ?? Infinity) - (roleOrder.get(b) ?? Infinity);
    });
    if (byRole.has(OTHER_ROLE.id)) sectionRoles.push(OTHER_ROLE.id);

    pickers[s.id] = sectionRoles.map((rk) => {
      const rm = roleMeta.get(rk);
      return {
        id: rk,
        label: rm?.name ?? OTHER_ROLE.label,
        color: rm?.color ?? OTHER_ROLE.color,
        shifts: byRole.get(rk)!,
      };
    });
  }
  return pickers;
}
