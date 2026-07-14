import type { DutyRow, DutySheet } from "@/types/domain";

// One printed line: shift-time segment (tabular, muted) + staff name.
function DutyLine({ time, name }: DutyRow) {
  return (
    <div className="flex items-baseline gap-4 py-[3px]">
      <span className="min-w-[120px] text-[14px] tabular-nums tracking-[0.3px] text-duty-time">
        {time}
      </span>
      <span className="text-[15px] font-semibold text-duty-ink">{name}</span>
    </div>
  );
}

function SectionRule({ label }: { label: string }) {
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

// A single A4 duty sheet (794×1123px on screen, forced to 210×296mm on print).
// A clean names + times document — no shift colors here, unlike the grid.
export function DutyRosterSheet({ sheet }: { sheet: DutySheet }) {
  return (
    <div className="duty-sheet relative flex min-h-[1123px] w-[794px] max-w-full flex-col bg-white px-[60px] pb-[44px] pt-[56px] text-duty-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
      <div className="absolute left-0 top-0 h-[5px] w-full bg-navy-deep" />

      <div className="text-center">
        <div className="text-[11.5px] font-semibold uppercase tracking-[5px] text-bronze-text">
          Victoria at Mt Eden
        </div>
        <div className="mt-2 font-serif text-[66px] font-medium leading-none tracking-[0.5px] text-navy-deep">
          Duty Roster
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

      <div className="mt-4 flex items-center gap-[14px] rounded-[11px] border border-line bg-duty-strip px-[18px] py-[11px]">
        <span className="text-[12px] font-bold uppercase tracking-[2.5px] text-navy-deep">
          On call
        </span>
        <span className="h-px flex-1 bg-duty-rule" />
        <span className="text-[15.5px] font-semibold tracking-[0.4px] text-ink">
          {sheet.onCall}
        </span>
      </div>

      {sheet.sections.map((sec) => (
        <div key={sec.label} className="mt-6">
          <SectionRule label={sec.label} />
          <div className="mt-3 grid grid-cols-2">
            <div className="pr-7">
              {sec.wesley.map((r, i) => (
                <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />
              ))}
              {sec.wEmpty && <div className="text-[14px] text-duty-empty">—</div>}
            </div>
            <div className="border-l-[1.5px] border-duty-rule pl-7">
              {sec.lodge.map((r, i) => (
                <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />
              ))}
              {sec.lEmpty && <div className="text-[14px] text-duty-empty">—</div>}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-6">
        <SectionRule label="Kitchen" />
        <div className="mx-auto mt-3 flex max-w-[420px] flex-col gap-[3px]">
          <div className="flex items-baseline gap-4 py-[3px]">
            <span className="min-w-[120px] text-[14px] font-bold uppercase tracking-[1px] text-navy-deep">
              Chef
            </span>
            <span className="text-[15px] font-semibold text-duty-ink">{sheet.chef}</span>
          </div>
          {sheet.kitchen.map((r, i) => (
            <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />
          ))}
        </div>
      </div>

      <div className="mt-auto pt-7">
        <div className="flex items-center justify-between border-t-2 border-navy-deep pt-[13px]">
          <span className="text-[11px] font-semibold uppercase tracking-[2px] text-duty-foot">
            Prepared from published roster
          </span>
          <span className="text-[16px] font-bold tracking-[2px] text-navy-deep">
            {sheet.dateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
