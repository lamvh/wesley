import { Fragment } from "react";
import type { RosterDay, RosterGrid, ShiftType } from "@/types/domain";
import { rosterCellKey } from "@/types/domain";
import type { RosterBand } from "@/lib/roster-grouping";
import { PersonBadge } from "@/components/shared/person-badge";
import { RosterCell } from "@/components/portal/roster/roster-cell";

interface RosterGridProps {
  bands: RosterBand[];
  days: RosterDay[];
  grid: RosterGrid;
  defs: Record<string, ShiftType>;
  /** staffId -> the shifts that staffer may be assigned (role-constrained). */
  pickers: Record<string, ShiftType[]>;
  totals: number[];
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
  openCell,
  onOpen,
  onClose,
  onToggle,
  onClear,
}: RosterGridProps) {
  const colSpan = days.length + 2;
  // Running row number offset per band, so numbering flows continuously across
  // bands (computed up-front to avoid mutating a counter during render).
  const bandOffsets: number[] = [];
  bands.reduce((acc, b) => {
    bandOffsets.push(acc);
    return acc + b.staff.length;
  }, 0);
  return (
    <div className="mt-4 overflow-x-auto rounded-[16px] border border-line bg-cream-2">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <thead>
          <tr className="bg-navy-deep">
            <th className="w-[34px] border-b border-line px-[6px] py-[11px] text-center text-[11.5px] font-bold text-sidebar-idle">
              #
            </th>
            <th className="w-[180px] border-b border-line px-3 py-[11px] text-left text-[11.5px] font-bold uppercase tracking-[0.4px] text-toggle-track">
              Staff
            </th>
            {days.map((d) => (
              <th
                key={`${d.dow}-${d.date}`}
                className="border-b border-b-line border-l border-l-sidebar-border px-1 py-[9px] text-center"
              >
                <div className="text-[12.5px] font-bold text-cream">{d.dow}</div>
                <div className="text-[11px] text-sidebar-muted">{d.date} {d.month}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bands.map((band, bi) => (
            <Fragment key={band.id}>
              <tr>
                <td
                  colSpan={colSpan}
                  className="border-b border-line-divider px-3 py-[7px]"
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
