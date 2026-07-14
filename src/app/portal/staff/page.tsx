import { StaffView } from "@/components/portal/staff/staff-view";
import { getStaff, getShiftTemplates, getLeaveRequests } from "@/lib/data/staff";
import { getRoles, getRoleGroups } from "@/lib/data/roles";
import { getPayrollHours } from "@/lib/data/payroll";
import { getRosterDays, parseISODate, rosterWeekTitle, toISODate, weekStartOf } from "@/lib/mock-data";

// Admin staff administration: team, roles & groups, shift templates, leave
// requests and payroll. RSC shell loads Supabase data; StaffView is the client
// island. ?week= drives the payroll pay-week (default current week); ?staffTab=
// keeps the payroll tab active across week navigation.
export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; staffTab?: string }>;
}) {
  const { week, staffTab } = await searchParams;
  const weekStart = weekStartOf(week ? parseISODate(week) : new Date());
  const weekStartISO = toISODate(weekStart);
  const days = getRosterDays(weekStart);

  const [staff, shifts, leaves, roles, groups, payrollHours] = await Promise.all([
    getStaff(),
    getShiftTemplates(),
    getLeaveRequests(),
    getRoles(),
    getRoleGroups(),
    getPayrollHours(weekStartISO, days[6].iso),
  ]);

  return (
    <StaffView
      staff={staff}
      shifts={shifts}
      leaves={leaves}
      roles={roles}
      groups={groups}
      payrollHours={payrollHours}
      weekStartISO={weekStartISO}
      weekLabel={rosterWeekTitle(days)}
      initialTab={staffTab === "payroll" ? "payroll" : undefined}
    />
  );
}
