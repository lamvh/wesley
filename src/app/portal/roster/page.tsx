import { RosterView } from "@/components/portal/roster/roster-view";

// Weekly roster scheduler: staff × 7-day assignable shift grid + leave requests.
// `?duty=1` opens the duty-roster print preview straight away.
export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ duty?: string }>;
}) {
  const { duty } = await searchParams;
  return <RosterView initialDutyPreview={duty === "1"} />;
}
