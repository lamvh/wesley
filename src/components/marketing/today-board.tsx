"use client";

import { useEffect, useRef, useState } from "react";
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

// Natural on-screen width of the A4 sheet (see DutySheetDocument). The height is
// measured rather than assumed: a long roster can push the document past its
// 1123px A4 minimum and the board must still fit that on one screen.
const SHEET_WIDTH = 794;

/**
 * Uniform scale that fits the whole sheet inside the space left under the status
 * bar, so the board shows the roster in exactly the printed layout - no phone
 * variant, no cropping, no scrolling. `offsetHeight` reports layout height, which
 * a CSS transform does not affect, so observing the sheet cannot feed back into
 * its own measurement.
 */
function useFitScale(
  areaRef: React.RefObject<HTMLDivElement | null>,
  sheetRef: React.RefObject<HTMLDivElement | null>,
) {
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const area = areaRef.current;
    const sheet = sheetRef.current;
    if (!area || !sheet) return;

    const fit = () => {
      const sheetHeight = sheet.offsetHeight || 1;
      setScale(Math.min(area.clientWidth / SHEET_WIDTH, area.clientHeight / sheetHeight));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [areaRef, sheetRef]);

  return scale;
}

// Public reception board. A live HH:MM clock (15s tick) + full date sit above the
// shared A4 duty-roster sheet (the same document the roster export prints, at the
// same proportions - only scaled to the device). The clock/date come from the
// device (Auckland-set reception iPad).
export function TodayBoard({ board }: { board: TodayBoardSheet }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const areaRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(areaRef, sheetRef);

  const dateLabel = `${FULL_DOW[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const sheetDate = `${ABBR_DOW[now.getDay()]} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#ECE4D4] px-4 pb-4 pt-3">
      {/* status bar: live dot + date (left) · clock (right) */}
      <div className="mx-auto mb-3 flex w-full max-w-[794px] shrink-0 items-center justify-between gap-4">
        <div className="inline-flex min-w-0 items-center gap-[9px] text-[12px] font-bold uppercase tracking-[1.4px] text-[#2C5A6E]">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[#6E875E] shadow-[0_0_0_4px_rgba(110,135,94,0.2)]" />
          <span className="truncate">Live · {dateLabel}</span>
        </div>
        <div className="shrink-0 text-[22px] font-bold tabular-nums tracking-[1px] text-navy-deep">
          {clock}
        </div>
      </div>

      {/* Scaling area: the sheet keeps its 794px layout width and is centred +
          scaled to fit, so the board always mirrors the printed duty roster. */}
      <div ref={areaRef} className="relative min-h-0 flex-1">
        <div
          ref={sheetRef}
          className="absolute left-1/2 top-1/2 w-[794px] origin-center"
          style={{
            transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
            // Hidden until the first measurement so the board never flashes at 1:1.
            visibility: scale === null ? "hidden" : undefined,
          }}
        >
          <DutySheetDocument
            dateLabel={sheetDate}
            onCall={board.onCall}
            sections={board.sections}
            kitchen={board.kitchen}
          />
        </div>
      </div>
    </div>
  );
}
