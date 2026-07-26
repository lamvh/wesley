import { DashboardView } from "@/components/portal/dashboard/dashboard-view";
import { getBirthdaysThisMonth } from "@/lib/data/residents";

// Thin RSC entry point. Role lives in a client context (usePortalRole), so the
// role-branched dashboard content is composed inside the client DashboardView;
// this-month birthdays are read live from Supabase and passed down.
export default async function PortalDashboardPage() {
  const birthdays = await getBirthdaysThisMonth();
  return <DashboardView birthdays={birthdays} />;
}
