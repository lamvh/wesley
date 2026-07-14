import { RosterView } from "@/components/portal/roster/roster-view";
import { getStaff } from "@/lib/data/staff";

// Weekly roster scheduler: real staff × 7-day assignable shift grid.
export default async function RosterPage() {
  const staff = await getStaff();
  return <RosterView staff={staff} />;
}
