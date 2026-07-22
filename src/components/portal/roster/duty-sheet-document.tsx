import type { DutyRow, DutySection } from "@/types/domain";

// One printed line: shift-time segment (tabular, muted) + staff name in caps.
function DutyLine({ time, name, compact }: DutyRow & { compact?: boolean }) {
  return (
    <div className={compact ? "flex items-baseline gap-2 py-[2px]" : "flex items-baseline gap-4 py-[3px]"}>
      <span
        className={
          compact
            ? "min-w-[56px] text-[9px] tabular-nums tracking-[0.2px] text-duty-time"
            : "min-w-[120px] text-[14px] tabular-nums tracking-[0.3px] text-duty-time"
        }
      >
        {time}
      </span>
      <span className={compact ? "text-[10px] font-semibold text-duty-ink" : "text-[15px] font-semibold text-duty-ink"}>
        {name.toUpperCase()}
      </span>
    </div>
  );
}

// One building column of a section. Empty → an em-dash placeholder so the two
// columns stay visually paired. `divider` draws the hairline between the columns.
function DutyColumn({ rows, divider, compact }: { rows: DutyRow[]; divider?: boolean; compact?: boolean }) {
  const padCls = compact ? (divider ? "border-l border-duty-rule pl-3" : "pr-3") : divider ? "border-l-[1.5px] border-duty-rule pl-7" : "pr-7";
  return (
    <div className={padCls}>
      {rows.length === 0 ? (
        <div className={compact ? "text-[9px] text-duty-empty" : "text-[14px] text-duty-empty"}>—</div>
      ) : (
        rows.map((r, i) => (
          <DutyLine key={`${r.time}-${r.name}-${i}`} time={r.time} name={r.name} compact={compact} />
        ))
      )}
    </div>
  );
}

// On-call strip: label · rule · name, boxed on the cream duty strip.
function OnCallStrip({ value, compact }: { value: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-2 rounded-[9px] border border-line bg-duty-strip px-3 py-2"
          : "flex items-center gap-[14px] rounded-[11px] border border-line bg-duty-strip px-[18px] py-[11px]"
      }
    >
      <span
        className={
          compact
            ? "text-[8.5px] font-bold uppercase tracking-[1px] text-navy-deep"
            : "text-[12px] font-bold uppercase tracking-[2.5px] text-navy-deep"
        }
      >
        On call
      </span>
      <span className="h-px flex-1 bg-duty-rule" />
      <span className={compact ? "text-[10.5px] font-semibold tracking-[0.2px] text-ink" : "text-[15.5px] font-semibold tracking-[0.4px] text-ink"}>
        {value || "-"}
      </span>
    </div>
  );
}

// Centred band header: a hairline rule flanks the label on both sides so every
// band reads the same way down the sheet. Label colour is uniform bronze rather
// than the band's roster colour — the print document stays monochrome-calm.
function BandRule({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-4"}>
      <span className="h-px flex-1 bg-duty-rule" />
      <span
        className={
          compact
            ? "text-[9px] font-bold uppercase tracking-[1px] text-bronze-text"
            : "text-[13px] font-bold uppercase tracking-[3.5px] text-bronze-text"
        }
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-duty-rule" />
    </div>
  );
}

interface DutySheetDocumentProps {
  /** Date stamp under the title and in the footer, e.g. "MON 13/07/26". */
  dateLabel: string;
  /** On-call staff name (Wesley only); "" renders a dash. */
  onCall: string;
  /** Role bands, each split into Wesley (left) and The Lodge (right) columns. */
  sections: DutySection[];
  /** Kitchen shifts — one band shared across both buildings (Lodge stays empty). */
  kitchen: DutyRow[];
  /**
   * Fluid mobile layout (smaller type/spacing, no fixed 794px A4 width)
   * instead of the print-identical desktop sheet. Only ever passed by the
   * public /today board, driven by a JS viewport check — never by the
   * duty-roster export preview, which must stay pixel-identical to print
   * regardless of the browser window's width.
   */
  compact?: boolean;
}

// The single A4 duty-roster sheet (794×1123px on screen, forced to 210×296mm on
// print). A clean names + times document grouped by role band and split into two
// per-building columns (Wesley left, The Lodge right), with the Kitchen band held
// separate below (shared across both buildings). Chrome: navy + gold header rule,
// italic date subtitle, a boxed building header row, centred band headers.
//
// Shared verbatim by the public reception board (/today) and the roster export
// print preview so both render pixel-identical — the only difference is the live
// status bar the board wraps this in, and the print stack the export wraps it in.
export function DutySheetDocument({ dateLabel, onCall, sections, kitchen, compact }: DutySheetDocumentProps) {
  return (
    <div
      className={
        compact
          ? "duty-sheet relative flex w-full flex-col bg-white px-4 pb-6 pt-5 text-duty-ink shadow-[0_12px_30px_-14px_rgba(0,0,0,0.4)]"
          : "duty-sheet relative flex min-h-[1123px] w-[794px] max-w-full flex-col bg-white px-[60px] pb-[44px] pt-[56px] text-duty-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]"
      }
    >
      {/* Navy + gold header rule. */}
      <div className="absolute left-0 top-0 h-[6px] w-full bg-navy-deep" />
      <div className="absolute left-0 top-[6px] h-[2px] w-full bg-bronze-text" />

      <div className="text-center">
        <div
          className={
            compact
              ? "text-[7.5px] font-semibold uppercase tracking-[1.5px] text-bronze-text"
              : "text-[11.5px] font-semibold uppercase tracking-[5px] text-bronze-text"
          }
        >
          Wesley Home &amp; Care
        </div>
        <div
          className={
            compact
              ? "mt-1 font-serif text-[26px] font-medium leading-none tracking-[0.3px] text-navy-deep"
              : "mt-2 font-serif text-[66px] font-medium leading-none tracking-[0.5px] text-navy-deep"
          }
        >
          Duty Roster
        </div>
        <div className={compact ? "mt-1 font-serif text-[9.5px] italic text-duty-time" : "mt-2 font-serif text-[17px] italic text-duty-time"}>
          Daily staff assignments · {dateLabel}
        </div>
      </div>

      {/* Building column header — Wesley | The Lodge, ruled top and bottom. */}
      <div
        className={
          compact
            ? "mt-4 grid grid-cols-2 border-y-2 border-navy-deep py-2"
            : "mt-[30px] grid grid-cols-2 border-y-2 border-navy-deep py-[13px]"
        }
      >
        <div className={compact ? "text-center text-[10.5px] font-bold uppercase tracking-[1.5px] text-navy-deep" : "text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep"}>
          Wesley
        </div>
        <div
          className={
            compact
              ? "border-l border-duty-rule text-center text-[10.5px] font-bold uppercase tracking-[1.5px] text-navy-deep"
              : "border-l-[1.5px] border-duty-rule text-center text-[19px] font-bold uppercase tracking-[6px] text-navy-deep"
          }
        >
          The Lodge
        </div>
      </div>

      <div className={compact ? "mt-2.5" : "mt-4"}>
        <OnCallStrip value={onCall} compact={compact} />
      </div>

      {sections.map((sec) => (
        <div key={sec.label} className={compact ? "mt-3.5" : "mt-6"}>
          <BandRule label={sec.label} compact={compact} />
          <div className={compact ? "mt-1.5 grid grid-cols-2" : "mt-3 grid grid-cols-2"}>
            <DutyColumn rows={sec.wesley} compact={compact} />
            <DutyColumn rows={sec.lodge} divider compact={compact} />
          </div>
        </div>
      ))}

      {/* Kitchen band — shared across both buildings, so it fills the Wesley
          column and leaves the Lodge column blank. */}
      <div className={compact ? "mt-3.5" : "mt-6"}>
        <BandRule label="Kitchen" compact={compact} />
        <div className={compact ? "mt-1.5 grid grid-cols-2" : "mt-3 grid grid-cols-2"}>
          <DutyColumn rows={kitchen} compact={compact} />
          <div className={compact ? "border-l border-duty-rule pl-3" : "border-l-[1.5px] border-duty-rule pl-7"} />
        </div>
      </div>

      <div className={compact ? "mt-6 pt-4" : "mt-auto pt-7"}>
        <div className={compact ? "flex items-center justify-end border-t-2 border-navy-deep pt-2" : "flex items-center justify-end border-t-2 border-navy-deep pt-[13px]"}>
          <span className={compact ? "text-[9.5px] font-bold tracking-[1px] text-navy-deep" : "text-[16px] font-bold tracking-[2px] text-navy-deep"}>
            {dateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
