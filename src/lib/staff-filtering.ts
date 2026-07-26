import { UNASSIGNED_GROUP_ID } from "@/lib/roster-grouping";
import type { RoleDef, RoleGroup, StaffRecord } from "@/types/domain";

// Faceted filtering for the Staff → Team directory: role group, status and
// contract chips on top of the existing free-text search.
//
// Kept out of the component so the matching rules are readable on their own -
// the chip UI is just a projection of what's below.

export interface StaffFacetOption {
  value: string;
  label: string;
  /** Count under the OTHER axes' current selections, not the whole list. */
  count: number;
  color?: string;
  tint?: string;
}

export interface StaffFacets {
  groups: StaffFacetOption[];
  statuses: StaffFacetOption[];
  contracts: StaffFacetOption[];
}

/** Selections per axis. Empty array = no constraint on that axis. */
export interface StaffFilter {
  groups: string[];
  statuses: string[];
  contracts: string[];
}

export const EMPTY_STAFF_FILTER: StaffFilter = { groups: [], statuses: [], contracts: [] };

export type StaffFilterAxis = keyof StaffFilter;

export function isFilterActive(f: StaffFilter): boolean {
  return f.groups.length > 0 || f.statuses.length > 0 || f.contracts.length > 0;
}

/** Every group a staffer touches through any of their roles.
 *
 * Deliberately ALL of them, not the single band the roster puts them in: the
 * roster has to place a person in exactly one row, but "show me kitchen staff"
 * should list anyone who does kitchen work, even if they also nurse.
 */
export function groupIdsForStaff(s: StaffRecord, groupOfRole: Map<string, string | null>): string[] {
  const ids = new Set<string>();
  for (const role of s.roles) ids.add(groupOfRole.get(role) || UNASSIGNED_GROUP_ID);
  // Someone with no role at all still has to be reachable from the chips.
  if (ids.size === 0) ids.add(UNASSIGNED_GROUP_ID);
  return [...ids];
}

/** Free-text search - the same fields the box has always covered. */
export function matchesQuery(s: StaffRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [s.name, s.preferredName, s.roles.join(" "), s.contract, s.visaType, s.phone, s.status]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesAxis(
  s: StaffRecord,
  axis: StaffFilterAxis,
  filter: StaffFilter,
  groupOfRole: Map<string, string | null>,
): boolean {
  const selected = filter[axis];
  if (selected.length === 0) return true;
  if (axis === "groups") {
    return groupIdsForStaff(s, groupOfRole).some((id) => selected.includes(id));
  }
  if (axis === "statuses") return selected.includes(s.status);
  return selected.includes(s.contract || "");
}

/** OR within an axis, AND across axes, AND the free-text query. */
export function filterStaff(
  staff: StaffRecord[],
  roles: RoleDef[],
  filter: StaffFilter,
  query: string,
): StaffRecord[] {
  const groupOfRole = new Map(roles.map((r) => [r.name, r.groupId]));
  return staff.filter(
    (s) =>
      matchesQuery(s, query) &&
      matchesAxis(s, "groups", filter, groupOfRole) &&
      matchesAxis(s, "statuses", filter, groupOfRole) &&
      matchesAxis(s, "contracts", filter, groupOfRole),
  );
}

/** Counts for one axis' chips, computed with that axis' own selection lifted.
 *
 * Otherwise selecting "Kitchen" would drive every other group chip to 0 and the
 * chips would stop being usable as a second choice. Lifting only the axis being
 * counted is what makes a chip's number mean "what you'd get if you picked this
 * too", which is the number worth showing.
 */
function countBy(
  staff: StaffRecord[],
  roles: RoleDef[],
  filter: StaffFilter,
  query: string,
  axis: StaffFilterAxis,
  valuesOf: (s: StaffRecord, groupOfRole: Map<string, string | null>) => string[],
): Map<string, number> {
  const groupOfRole = new Map(roles.map((r) => [r.name, r.groupId]));
  const pool = filterStaff(staff, roles, { ...filter, [axis]: [] }, query);
  const counts = new Map<string, number>();
  for (const s of pool) {
    for (const v of valuesOf(s, groupOfRole)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

/** Chip sets for all three axes.
 *
 * Groups come from the registry so their order and palette match the roster
 * bands. Status and contract come from the data rather than a hardcoded list -
 * "On leave" is derived at read time and never stored, so a fixed list would
 * either miss it or offer values nobody holds.
 */
export function buildStaffFacets(
  staff: StaffRecord[],
  roles: RoleDef[],
  groups: RoleGroup[],
  filter: StaffFilter,
  query: string,
): StaffFacets {
  const groupCounts = countBy(staff, roles, filter, query, "groups", (s, m) => groupIdsForStaff(s, m));
  const statusCounts = countBy(staff, roles, filter, query, "statuses", (s) => [s.status]);
  const contractCounts = countBy(staff, roles, filter, query, "contracts", (s) => [s.contract || ""]);

  const groupOptions: StaffFacetOption[] = groups.map((g) => ({
    value: g.id,
    label: g.label,
    count: groupCounts.get(g.id) ?? 0,
    color: g.color,
    tint: g.tint,
  }));
  // Only offer "No group" when somebody is actually in it - most homes will
  // have an Admin or Team Leader, but an empty chip is just noise.
  const unassignedTotal = countBy(staff, roles, EMPTY_STAFF_FILTER, "", "groups", (s, m) =>
    groupIdsForStaff(s, m)).get(UNASSIGNED_GROUP_ID) ?? 0;
  if (unassignedTotal > 0) {
    groupOptions.push({
      value: UNASSIGNED_GROUP_ID,
      label: "No group",
      count: groupCounts.get(UNASSIGNED_GROUP_ID) ?? 0,
    });
  }

  const distinct = (vals: string[]) => [...new Set(vals)].filter(Boolean).sort();
  const toOptions = (values: string[], counts: Map<string, number>): StaffFacetOption[] =>
    values.map((v) => ({ value: v, label: v, count: counts.get(v) ?? 0 }));

  return {
    groups: groupOptions,
    statuses: toOptions(distinct(staff.map((s) => s.status)), statusCounts),
    contracts: toOptions(distinct(staff.map((s) => s.contract)), contractCounts),
  };
}

/** Add or remove one value from an axis. */
export function toggleFilterValue(
  filter: StaffFilter,
  axis: StaffFilterAxis,
  value: string,
): StaffFilter {
  const current = filter[axis];
  return {
    ...filter,
    [axis]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
  };
}
