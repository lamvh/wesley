import type { Visit } from "@/types/domain";

// Upcoming-visit line: month/day date badge beside who + detail.
export function VisitRow({ visit }: { visit: Visit }) {
  return (
    <div className="flex items-center gap-[13px] border-b border-line-divider py-[11px]">
      <div className="w-11 shrink-0 text-center">
        <div className="text-[11px] font-bold uppercase text-bronze-text">{visit.mon}</div>
        <div className="font-serif text-[20px] leading-none text-ink">{visit.day}</div>
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink">{visit.who}</div>
        <div className="text-[12.5px] text-ink-faint">{visit.detail}</div>
      </div>
    </div>
  );
}
