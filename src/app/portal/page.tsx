import { DashboardView } from "@/components/portal/dashboard/dashboard-view";

// Thin RSC entry point. Role lives in a client context (usePortalRole), so the
// role-branched dashboard content is composed inside the client DashboardView.
export default function PortalDashboardPage() {
  return <DashboardView />;
}
