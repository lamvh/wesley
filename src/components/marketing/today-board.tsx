"use client";

import { useEffect, useState } from "react";
import type { TodayBoardSheet } from "@/types/domain";
import { DutySheetDocument } from "@/components/portal/roster/duty-sheet-document";

const FULL_DOW = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const ABBR_DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");

// Below this, the sheet switches from the fixed 794px A4 replica to a fluid
// `compact` layout with mobile-appropriate spacing/font sizes (see
// DutySheetDocument). Driven by JS rather than a Tailwind breakpoint so the
// print export - which reuses the same component verbatim - never has its
// rendering depend on whatever width the browser's print viewport happens
// to report.
const COMPACT_BREAKPOINT = 640;

function useIsCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT - 1}px)`);
    const update = () => setCompact(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return compact;
}

// Public reception board. A live HH:MM clock (15s tick) + full date sit above the
// shared A4 duty-roster sheet (the same document the roster export prints). The
// clock/date come from the device (Auckland-set reception iPad).
export function TodayBoard({ board }: { board: TodayBoardSheet }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const compact = useIsCompact();

  const dateLabel = `${FULL_DOW[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const sheetDate = `${ABBR_DOW[now.getDay()]} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className={compact ? "bg-[#ECE4D4] px-3 pb-10 pt-4" : "bg-[#ECE4D4] px-5 pb-16 pt-[26px]"}>
      {/* status bar: live dot + date (left) · clock (right) */}
      <div
        className={
          compact
            ? "mx-auto mb-3 flex max-w-[794px] flex-wrap items-center justify-between gap-2"
            : "mx-auto mb-[22px] flex max-w-[794px] flex-wrap items-center justify-between gap-4"
        }
      >
        <div
          className={
            compact
              ? "inline-flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[1px] text-[#2C5A6E]"
              : "inline-flex items-center gap-[9px] text-[12px] font-bold uppercase tracking-[1.4px] text-[#2C5A6E]"
          }
        >
          <span className="h-[9px] w-[9px] rounded-full bg-[#6E875E] shadow-[0_0_0_4px_rgba(110,135,94,0.2)]" />
          Live · {dateLabel}
        </div>
        <div
          className={
            compact
              ? "text-[17px] font-bold tabular-nums tracking-[1px] text-navy-deep"
              : "text-[22px] font-bold tabular-nums tracking-[1px] text-navy-deep"
          }
        >
          {clock}
        </div>
      </div>

      <div className={compact ? "mx-auto w-full" : "mx-auto w-fit max-w-full"}>
        <DutySheetDocument
          dateLabel={sheetDate}
          onCall={board.onCall}
          sections={board.sections}
          kitchen={board.kitchen}
          compact={compact}
        />
      </div>
    </div>
  );
}
