import { RosterView } from "@/components/portal/roster/roster-view";
import { getStaff } from "@/lib/data/staff";
import {
  getOnCallByDay,
  getRosterAssignments,
  getRosterShiftTypes,
  getShiftUsageByStaff,
} from "@/lib/data/roster";
import { getRoles, getRoleGroups } from "@/lib/data/roles";
import { getRosterDays, parseISODate, toISODate, weekStartOf } from "@/lib/mock-data";

// Weekly roster scheduler: real staff × 7-day assignable shift grid. The visible
// week is driven by ?week=YYYY-MM-DD (defaults to the current week) so persisted
// assignments reload naturally as the user navigates weeks.
export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; duty?: string }>;
}) {
  const { week, duty } = await searchParams;
  const weekStart = weekStartOf(week ? parseISODate(week) : new Date());
  const weekStartISO = toISODate(weekStart);
  const days = getRosterDays(weekStart);

  const [staff, grid, shiftTypes, roles, groups, onCallByDay, shiftUsage] = await Promise.all([
    getStaff(),
    getRosterAssignments(weekStartISO, days[6].iso),
    getRosterShiftTypes(),
    getRoles(),
    getRoleGroups(),
    getOnCallByDay(weekStartISO, days[6].iso),
    getShiftUsageByStaff(weekStartISO),
  ]);

  return (
    <RosterView
      key={weekStartISO}
      staff={staff}
      days={days}
      initialGrid={grid}
      shiftTypes={shiftTypes}
      roles={roles}
      groups={groups}
      weekStartISO={weekStartISO}
      initialOnCallByDay={onCallByDay}
      shiftUsage={shiftUsage}
      initialDutyPreview={duty === "1"}
    />
  );
}
