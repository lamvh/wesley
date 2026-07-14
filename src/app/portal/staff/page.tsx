import { StaffView } from "@/components/portal/staff/staff-view";
import { getStaff, getShiftTemplates, getLeaveRequests } from "@/lib/data/staff";

// Admin staff administration: team roster, shift templates and leave requests.
// RSC shell loads Supabase data; StaffView is the interactive client island.
export default async function StaffPage() {
  const [staff, shifts, leaves] = await Promise.all([
    getStaff(),
    getShiftTemplates(),
    getLeaveRequests(),
  ]);
  return <StaffView staff={staff} shifts={shifts} leaves={leaves} />;
}
