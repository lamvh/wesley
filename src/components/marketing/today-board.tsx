"use client";

import { useEffect, useState } from "react";
import type { TodayBoardSheet } from "@/types/domain";

const FULL_DOW = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const ABBR_DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");

function DutyLine({ time, name }: { time: string; name: string }) {
  return (
    <div className="flex items-baseline gap-4 py-[3px]">
      <span className="min-w-[120px] text-[14px] tabular-nums tracking-[0.3px] text-duty-time">
        {time}
      </span>
      <span className="text-[15px] font-semibold text-duty-ink">{name.toUpperCase()}</span>
    </div>
  );
}

function DutyColumn({
  rows,
  divider,
}: {
  rows: { time: string; name: string }[];
  divider?: boolean;
}) {
  return (
    <div className={divider ? "border-l-[1.5px] border-duty-rule pl-7" : "pr-7"}>
      {rows.length === 0 ? (
        <div className="text-[14px] text-duty-empty">—</div>
      ) : (
        rows.map((r, i) => <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />)
      )}
    </div>
  );
}

function OnCallStrip({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-[14px] rounded-[11px] border border-line bg-duty-strip px-[18px] py-[11px]">
      <span className="text-[12px] font-bold uppercase tracking-[2.5px] text-navy-deep">
        On call
      </span>
      <span className="h-px flex-1 bg-duty-rule" />
      <span className="text-[15.5px] font-semibold tracking-[0.4px] text-ink">
        {value || "-"}
      </span>
    </div>
  );
}

function BandRule({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-duty-rule" />
      <span className="text-[13px] font-bold uppercase tracking-[3.5px] text-bronze-text">
        {label}
      </span>
      <span className="h-px flex-1 bg-duty-rule" />
    </div>
  );
}

// Public reception board. A live HH:MM clock (15s tick) + full date sit above an
// A4 "duty roster" sheet: role bands split Wesley | The Lodge, then a Kitchen
// band. Clock/date come from the device (Auckland-set reception iPad).
export function TodayBoard({ board }: { board: TodayBoardSheet }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = `${FULL_DOW[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const sheetDate = `${ABBR_DOW[now.getDay()]} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)}`;
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div className="bg-[#ECE4D4] px-5 pb-16 pt-[26px]">
      {/* status bar: live dot + date (left) · clock (right) */}
      <div className="mx-auto mb-[22px] flex max-w-[794px] flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-[9px] text-[12px] font-bold uppercase tracking-[1.4px] text-[#2C5A6E]">
          <span className="h-[9px] w-[9px] rounded-full bg-[#6E875E] shadow-[0_0_0_4px_rgba(110,135,94,0.2)]" />
          Live · {dateLabel}
        </div>
        <div className="text-[22px] font-bold tabular-nums tracking-[1px] text-navy-deep">{clock}</div>
      </div>

      {/* A4 sheet */}
      <div className="relative mx-auto flex min-h-[1123px] w-[794px] max-w-full flex-col bg-white px-[60px] pb-[44px] pt-[56px] text-duty-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]">
        <div className="absolute left-0 top-0 h-[6px] w-full bg-navy-deep" />
        <div className="absolute left-0 top-[6px] h-[2px] w-full bg-bronze-text" />

        <div className="text-center">
          <div className="text-[11.5px] font-semibold uppercase tracking-[5px] text-bronze-text">
            Wesley Home &amp; Care
          </div>
          <div className="mt-2 font-serif text-[66px] font-medium leading-none tracking-[0.5px] text-navy-deep">
            Duty Roster
          </div>
          <div className="mt-2 font-serif text-[17px] italic text-duty-time">
            Daily staff assignments · {sheetDate}
          </div>
        </div>

        <div className="mt-[30px] grid grid-cols-2 border-y-2 border-navy-deep py-[13px]">
          <div className="text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">
            Wesley
          </div>
          <div className="border-l-[1.5px] border-duty-rule text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">
            The Lodge
          </div>
        </div>

        <div className="mt-4">
          <OnCallStrip value={board.onCall} />
        </div>

        {board.sections.map((sec) => (
          <div key={sec.label} className="mt-6">
            <BandRule label={sec.label} />
            <div className="mt-3 grid grid-cols-2">
              <DutyColumn rows={sec.wesley} />
              <DutyColumn rows={sec.lodge} divider />
            </div>
          </div>
        ))}

        <div className="mt-6">
          <BandRule label="Kitchen" />
          <div className="mt-3 grid grid-cols-2">
            <DutyColumn rows={board.kitchen} />
            <div className="border-l-[1.5px] border-duty-rule pl-7" />
          </div>
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center justify-end border-t-2 border-navy-deep pt-[13px]">
            <span className="text-[16px] font-bold tracking-[2px] text-navy-deep">{sheetDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
