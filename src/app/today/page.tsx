import { getTodayOnCall, getTodayOnDuty } from "@/lib/data/today-on-duty";
import { buildTodayBoard } from "@/lib/today-board";
import { TodayBoard } from "@/components/marketing/today-board";

// Public reception-iPad board: today's rostered staff by building. Data is read
// fresh per request via anon SECURITY DEFINER rpcs; the live clock is client-side.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [rows, onCallRows] = await Promise.all([getTodayOnDuty(), getTodayOnCall()]);
  const board = buildTodayBoard(rows, onCallRows);
  return <TodayBoard board={board} />;
}
