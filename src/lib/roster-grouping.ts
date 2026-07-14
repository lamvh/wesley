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

// Which shift templates each staff member may be assigned on the roster: a
// shift is offered only to staff who hold a role in the same group as the
// shift's role. Shifts with no role (or a role that maps to no group) are
// unrestricted and offered to everyone. A staffer whose roles match no shift
// falls back to the full list so a cell is never un-assignable.
export function rosterPickersFor(
  staff: StaffRecord[],
  roles: RoleDef[],
  shiftTypes: ShiftType[],
): Record<string, ShiftType[]> {
  const roleToGroup = new Map(roles.map((r) => [r.name, r.groupId]));

  // Group a shift's role maps to (null = unrestricted: no role, or role has no group).
  const shiftGroup = (st: ShiftType): string | null =>
    st.role ? roleToGroup.get(st.role) ?? null : null;

  const pickers: Record<string, ShiftType[]> = {};
  for (const s of staff) {
    const myGroups = new Set(
      s.roles.map((r) => roleToGroup.get(r)).filter((g): g is string => g != null),
    );
    const allowed = shiftTypes.filter((st) => {
      const g = shiftGroup(st);
      return g == null || myGroups.has(g);
    });
    pickers[s.id] = allowed.length ? allowed : shiftTypes;
  }
  return pickers;
}
