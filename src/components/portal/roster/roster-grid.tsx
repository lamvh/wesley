import { Fragment } from "react";
import type { PersonColor, RosterDay, RosterGrid, ShiftType } from "@/types/domain";
import { rosterCellKey } from "@/types/domain";
import type { RosterBand } from "@/lib/roster-grouping";
import { PersonBadge } from "@/components/shared/person-badge";
import { RosterCell } from "@/components/portal/roster/roster-cell";

/** One selectable on-call candidate (nurses first, then HCAs, then the rest). */
export interface OnCallOption {
  value: string;
  label: string;
  initials: string;
  color: PersonColor;
}

interface RosterGridProps {
  bands: RosterBand[];
  days: RosterDay[];
  grid: RosterGrid;
  defs: Record<string, ShiftType>;
  /** staffId -> the flat list of shifts to offer (filtered to the staffer's
   *  role group, canonical order). */
  pickers: Record<string, ShiftType[]>;
  totals: number[];
  /** On-call carer per day, keyed by day ISO (value = staff name). */
  onCallByDay: Record<string, string>;
  onCallOptions: OnCallOption[];
  onOnCall: (dateISO: string, value: string) => void;
  openCell: string | null;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string, id: string) => void;
  onClear: (key: string) => void;
}

// The weekly scheduler table: navy header, staff rows banded by role group
// (each band led by a coloured header row), 7 day cells, and a "Staff on duty"
// totals footer. Row numbers run continuously across bands. Scrolls horizontally
// on narrow screens via the parent overflow container.
export function RosterGrid({
  bands,
  days,
  grid,
  defs,
  pickers,
  totals,
  onCallByDay,
  onCallOptions,
  onOnCall,
  openCell,
  onOpen,
  onClose,
  onToggle,
  onClear,
}: RosterGridProps) {
  const colSpan = days.length + 2;
  const onCallMeta = Object.fromEntries(onCallOptions.map((o) => [o.value, o]));
  // Running row number offset per band, so numbering flows continuously across
  // bands (computed up-front to avoid mutating a counter during render).
  const bandOffsets: number[] = [];
  bands.reduce((acc, b) => {
    bandOffsets.push(acc);
    return acc + b.staff.length;
  }, 0);
  return (
    <div className="mt-4 max-h-[calc(100vh-230px)] overflow-auto rounded-[16px] border border-line bg-cream-2">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <thead>
          {/* Weekday header sticks to the top of the scroll box so the day each
              cell belongs to stays visible while scrolling the roster. */}
          <tr className="bg-navy-deep">
            <th className="sticky top-0 z-30 h-[46px] w-[34px] border-b border-line bg-navy-deep px-[6px] py-[11px] text-center text-[11.5px] font-bold text-sidebar-idle">
              #
            </th>
            <th className="sticky top-0 z-30 h-[46px] w-[180px] border-b border-line bg-navy-deep px-3 py-[11px] text-left text-[11.5px] font-bold uppercase tracking-[0.4px] text-toggle-track">
              Staff
            </th>
            {days.map((d) => (
              <th
                key={`${d.dow}-${d.date}`}
                className="sticky top-0 z-30 h-[46px] border-b border-b-line border-l border-l-sidebar-border bg-navy-deep px-1 py-[9px] text-center"
              >
                <div className="text-[12.5px] font-bold text-cream">{d.dow}</div>
                <div className="text-[11px] text-sidebar-muted">{d.date} {d.month}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* On-call carer per day — nurse/HCA who covers after hours. Feeds
              the duty-roster export. */}
          <tr className="border-b-2 border-line bg-navy-tint">
            <td
              colSpan={2}
              className="px-3 py-[8px] text-right align-middle text-[11.5px] font-bold uppercase tracking-[0.4px] text-navy"
            >
              On call
              <div className="text-[10px] font-medium normal-case tracking-normal text-ink-faint">
                Nurse / HCA
              </div>
            </td>
            {days.map((d) => {
              const meta = onCallMeta[onCallByDay[d.iso] ?? ""];
              return (
                <td key={d.iso} className="border-l border-line-divider px-[5px] py-[6px]">
                  <div className="flex items-center gap-1.5">
                    {meta ? (
                      <PersonBadge
                        initials={meta.initials}
                        color={meta.color}
                        className="size-5 rounded-full text-[8.5px]"
                      />
                    ) : (
                      <span className="size-5 shrink-0 rounded-full border border-dashed border-line-strong" />
                    )}
                    <select
                      value={onCallByDay[d.iso] ?? ""}
                      onChange={(e) => onOnCall(d.iso, e.target.value)}
                      aria-label={`On call for ${d.dow} ${d.date}`}
                      className="w-full min-w-0 rounded-[7px] border border-line-soft bg-cream px-1 py-1 text-[11px] font-semibold text-ink outline-none"
                    >
                      <option value="">—</option>
                      {onCallOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              );
            })}
          </tr>
          {bands.map((band, bi) => (
            <Fragment key={band.id}>
              <tr>
                {/* Group-name band header sticks just below the weekday row so
                    the group each staffer belongs to stays visible too. */}
                <td
                  colSpan={colSpan}
                  className="sticky top-[46px] z-20 border-b border-line-divider px-3 py-[7px]"
                  style={{ background: band.tint }}
                >
                  <span
                    className="text-[12px] font-bold uppercase tracking-[0.5px]"
                    style={{ color: band.color }}
                  >
                    {band.label}
                  </span>
                  <span className="ml-2 text-[11.5px] font-semibold text-ink-faint">
                    {band.staff.length}
                  </span>
                </td>
              </tr>
              {band.staff.map((st, si) => (
                  <tr key={st.id} className="border-b border-line-divider">
                    <td className="text-center text-[12.5px] font-semibold text-ink-faint">
                      {bandOffsets[bi] + si + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-[9px]">
                        <PersonBadge
                          initials={st.initials}
                          color={st.color}
                          className="size-[30px] rounded-full text-[11px]"
                        />
                        <span className="text-[13.5px] font-semibold leading-[1.15] text-ink">
                          {st.name}
                        </span>
                      </div>
                    </td>
                    {days.map((d, ci) => {
                      const cellKey = rosterCellKey(st.id, d.iso);
                      return (
                        <RosterCell
                          key={cellKey}
                          cellKey={cellKey}
                          colIndex={ci}
                          ids={grid[cellKey] ?? []}
                          defs={defs}
                          pickerDefs={pickers[st.id] ?? []}
                          staffName={st.name}
                          staffRole={st.roles[0] ?? ""}
                          dayLabel={`${d.dow} ${d.date}`}
                          isOpen={openCell === cellKey}
                          onOpen={onOpen}
                          onClose={onClose}
                          onToggle={onToggle}
                          onClear={onClear}
                        />
                      );
                    })}
                  </tr>
              ))}
            </Fragment>
          ))}
          <tr className="bg-cream">
            <td
              colSpan={2}
              className="px-3 py-[10px] text-right text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint"
            >
              Staff on duty
            </td>
            {totals.map((t, ci) => (
              <td
                key={ci}
                className="border-l border-line-divider text-center font-serif text-[19px] text-ink"
              >
                {t}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
