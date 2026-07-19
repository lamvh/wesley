import type { DutyRow, DutySheet } from "@/types/domain";

// One printed line: shift-time segment (tabular, muted) + staff name in caps.
function DutyLine({ time, name }: DutyRow) {
  return (
    <div className="flex items-baseline gap-4 py-[3px]">
      <span className="min-w-[120px] text-[14px] tabular-nums tracking-[0.3px] text-duty-time">
        {time}
      </span>
      <span className="text-[15px] font-semibold text-duty-ink">{name.toUpperCase()}</span>
    </div>
  );
}

// One building column of a section. Empty → an em-dash placeholder so the two
// columns stay visually paired. `divider` draws the hairline between the columns.
function DutyColumn({ rows, divider }: { rows: DutyRow[]; divider?: boolean }) {
  return (
    <div className={divider ? "border-l-[1.5px] border-duty-rule pl-7" : "pr-7"}>
      {rows.length === 0 ? (
        <div className="text-[14px] text-duty-empty">-</div>
      ) : (
        rows.map((r, i) => <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} />)
      )}
    </div>
  );
}

// On-call strip: label · rule · name, boxed on the cream duty strip.
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

// Centred section header: a hairline rule flanks the label on both sides so every
// band reads the same way down the sheet. Label colour is uniform (bronze) rather
// than the band's roster colour - the print document stays monochrome-calm.
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
// A clean names + times document grouped by role band and split into two
// per-building columns (Wesley left, The Lodge right) by the building each shift
// belongs to - no shift colours here, unlike the grid. Chrome: navy + gold header
// rule, italic date subtitle, a boxed building header row, centred band headers.
export function DutyRosterSheet({ sheet }: { sheet: DutySheet }) {
  return (
    <div className="duty-sheet relative flex min-h-[1123px] w-[794px] max-w-full flex-col bg-white px-[60px] pb-[44px] pt-[56px] text-duty-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
      {/* Navy + gold header rule. */}
      <div className="absolute left-0 top-0 h-[6px] w-full bg-navy-deep" />
      <div className="absolute left-0 top-[6px] h-[2px] w-full bg-bronze-text" />

      <div className="text-center">
        <div className="text-[11.5px] font-semibold uppercase tracking-[5px] text-bronze-text">
          Wesley Home &amp; Care
        </div>
        <div className="mt-2 font-serif text-[66px] font-medium leading-none tracking-[0.5px] text-navy-deep">
          Duty Roster
        </div>
        {/* Italic date subtitle. */}
        <div className="mt-2 font-serif text-[17px] italic text-duty-time">
          Daily staff assignments · {sheet.dateLabel}
        </div>
      </div>

      {/* Building column header - Wesley | The Lodge, ruled top and bottom. */}
      <div className="mt-[30px] grid grid-cols-2 border-y-2 border-navy-deep py-[13px]">
        <div className="text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">
          Wesley
        </div>
        <div className="border-l-[1.5px] border-duty-rule text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep">
          The Lodge
        </div>
      </div>

      <div className="mt-4">
        <OnCallStrip value={sheet.onCall} />
      </div>

      {sheet.sections.length === 0 ? (
        <div className="mt-[60px] text-center text-[15px] text-duty-empty">
          No shifts assigned for this day.
        </div>
      ) : (
        sheet.sections.map((sec) => (
          <div key={sec.label} className="mt-6">
            <SectionRule label={sec.label} />
            <div className="mt-3 grid grid-cols-2">
              <DutyColumn rows={sec.wesley} />
              <DutyColumn rows={sec.lodge} divider />
            </div>
          </div>
        ))
      )}

      <div className="mt-auto pt-7">
        <div className="flex items-center justify-end border-t-2 border-navy-deep pt-[13px]">
          <span className="text-[16px] font-bold tracking-[2px] text-navy-deep">
            {sheet.dateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
