import type { RosterDay, RosterGrid, RosterStaff, ShiftType } from "@/types/domain";
import { PersonBadge } from "@/components/shared/person-badge";
import { RosterCell } from "@/components/portal/roster/roster-cell";

interface RosterGridProps {
  staff: RosterStaff[];
  days: RosterDay[];
  grid: RosterGrid;
  defs: Record<string, ShiftType>;
  pickerDefs: ShiftType[];
  totals: number[];
  openCell: string | null;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string, id: string) => void;
  onClear: (key: string) => void;
}

// The weekly scheduler table: navy header, one row per staff member with 7 day
// cells, and a "Staff on duty" totals footer. Scrolls horizontally on narrow
// screens via the parent overflow container (body never scrolls sideways).
export function RosterGrid({
  staff,
  days,
  grid,
  defs,
  pickerDefs,
  totals,
  openCell,
  onOpen,
  onClose,
  onToggle,
  onClear,
}: RosterGridProps) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[16px] border border-line bg-cream-2">
      <table className="w-full min-w-[860px] table-fixed border-collapse">
        <thead>
          <tr className="bg-navy-deep">
            <th className="w-[34px] border-b border-line px-[6px] py-[11px] text-center text-[11.5px] font-bold text-sidebar-idle">
              #
            </th>
            <th className="w-[150px] border-b border-line px-3 py-[11px] text-left text-[11.5px] font-bold uppercase tracking-[0.4px] text-toggle-track">
              Staff
            </th>
            <th className="w-[52px] border-b border-line px-1 py-[11px] text-center text-[11.5px] font-bold text-sidebar-idle">
              Pos
            </th>
            {days.map((d) => (
              <th
                key={`${d.dow}-${d.date}`}
                className="border-b border-b-line border-l border-l-sidebar-border px-1 py-[9px] text-center"
              >
                <div className="text-[12.5px] font-bold text-cream">{d.dow}</div>
                <div className="text-[11px] text-sidebar-muted">{d.date} Jul</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((st, ri) => (
            <tr key={st.name} className="border-b border-line-divider">
              <td className="text-center text-[12.5px] font-semibold text-ink-faint">
                {ri + 1}
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
              <td className="text-center">
                <span className="rounded-full bg-toggle-track px-2 py-[3px] text-[11px] font-bold text-ink-meta">
                  {st.pos}
                </span>
              </td>
              {days.map((d, ci) => {
                const cellKey = `${ri}-${ci}`;
                return (
                  <RosterCell
                    key={cellKey}
                    cellKey={cellKey}
                    colIndex={ci}
                    ids={grid[cellKey] ?? []}
                    defs={defs}
                    pickerDefs={pickerDefs}
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
          <tr className="bg-cream">
            <td
              colSpan={3}
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
