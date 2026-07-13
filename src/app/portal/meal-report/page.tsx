import { MealReportView } from "@/components/portal/meal-report/meal-report-view";

// Daily meal-intake logging screen. The intake log is client state, so the
// interactive body lives in <MealReportView/>; this page just mounts it.
export default function MealReportPage() {
  return <MealReportView />;
}
