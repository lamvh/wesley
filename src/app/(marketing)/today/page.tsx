import { getTodayOnDuty } from "@/lib/data/today-on-duty";
import { buildTodayBoard } from "@/lib/today-board";
import { TodayBoard } from "@/components/marketing/today-board";

// Public reception-iPad board: today's rostered staff by building. Data is read
// fresh per request via an anon SECURITY DEFINER rpc; the live clock is client-side.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const rows = await getTodayOnDuty();
  const board = buildTodayBoard(rows);
  return <TodayBoard board={board} />;
}
