import { RosterView } from "@/components/portal/roster/roster-view";
import { getStaff } from "@/lib/data/staff";
import { getRosterAssignments } from "@/lib/data/roster";
import { getRosterDays, parseISODate, toISODate, weekStartOf } from "@/lib/mock-data";

// Weekly roster scheduler: real staff × 7-day assignable shift grid. The visible
// week is driven by ?week=YYYY-MM-DD (defaults to the current week) so persisted
// assignments reload naturally as the user navigates weeks.
export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = weekStartOf(week ? parseISODate(week) : new Date());
  const weekStartISO = toISODate(weekStart);
  const days = getRosterDays(weekStart);

  const [staff, grid] = await Promise.all([
    getStaff(),
    getRosterAssignments(weekStartISO, days[6].iso),
  ]);

  return (
    <RosterView
      key={weekStartISO}
      staff={staff}
      days={days}
      initialGrid={grid}
      weekStartISO={weekStartISO}
    />
  );
}
