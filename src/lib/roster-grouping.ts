import type { RoleDef, RoleGroup, StaffRecord } from "@/types/domain";

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

  // Best (earliest) group id for a staffer, or null when unassigned.
  const bandOf = (s: StaffRecord): string | null => {
    let best: string | null = null;
    let bestRank = Infinity;
    for (const roleName of s.roles) {
      const gid = roleToGroup.get(roleName) ?? null;
      if (gid == null) continue;
      const r = rank.get(gid);
      if (r != null && r < bestRank) {
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
      bands.push({ id: g.id, label: g.label, color: g.color, tint: g.tint, staff: members });
    }
  }
  if (unassigned.length) bands.push({ ...UNASSIGNED, staff: unassigned });
  return bands;
}
