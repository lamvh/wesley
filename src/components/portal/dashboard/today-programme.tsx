import type { ScheduleItem } from "@/types/domain";

// Today's programme card: time (navy) + title + location, divided rows.
export function TodayProgramme({ schedule }: { schedule: ScheduleItem[] }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <h3 className="m-0 font-serif text-[20px] font-semibold">Today&rsquo;s programme</h3>
      <div className="mt-[14px] flex flex-col gap-[2px]">
        {schedule.map((s) => (
          <div
            key={`${s.time}-${s.title}`}
            className="flex gap-[14px] border-b border-line-divider py-[11px]"
          >
            <div className="w-[58px] shrink-0 text-[13px] font-bold text-navy">{s.time}</div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink-soft">{s.title}</div>
              <div className="text-[12.5px] text-ink-faint">{s.where}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
