import { StaffView } from "@/components/portal/staff/staff-view";
import { getStaff, getShiftTemplates, getLeaveRequests } from "@/lib/data/staff";
import { getRoles, getRoleGroups } from "@/lib/data/roles";

// Admin staff administration: team, roles & groups, shift templates and leave
// requests. RSC shell loads Supabase data; StaffView is the client island.
export default async function StaffPage() {
  const [staff, shifts, leaves, roles, groups] = await Promise.all([
    getStaff(),
    getShiftTemplates(),
    getLeaveRequests(),
    getRoles(),
    getRoleGroups(),
  ]);
  return (
    <StaffView staff={staff} shifts={shifts} leaves={leaves} roles={roles} groups={groups} />
  );
}
