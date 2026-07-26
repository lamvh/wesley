import { DashboardView } from "@/components/portal/dashboard/dashboard-view";
import { getBirthdaysThisMonth } from "@/lib/data/residents";
import { getDashboardKpis } from "@/lib/data/dashboard";

// Thin RSC entry point. Role lives in a client context (usePortalRole), so the
// role-branched greeting and alerts are composed inside the client
// DashboardView; the live figures are read here and passed down.
//
// KPIs and birthdays both span EVERY home - the dashboard is the whole-
// organisation view, the one screen deliberately not scoped to a building.
export default async function PortalDashboardPage() {
  const [birthdays, kpis] = await Promise.all([
    getBirthdaysThisMonth(),
    getDashboardKpis(),
  ]);
  return <DashboardView birthdays={birthdays} kpis={kpis} />;
}
