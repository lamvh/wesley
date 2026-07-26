import { Fragment } from "react";
import type {
  PersonColor,
  RosterDay,
  RosterGrid,
  ShiftType,
  ShiftUsageByStaff,
  StaffRecord,
} from "@/types/domain";
import { rosterCellKey } from "@/types/domain";
import type { RosterBand, RosterPickerGroup } from "@/lib/roster-grouping";
import { PersonBadge } from "@/components/shared/person-badge";
import { RosterCell } from "@/components/portal/roster/roster-cell";
import {
  StaffHoursCell,
  BandHoursCell,
  WeekHoursCell,
} from "@/components/portal/roster/roster-hours-cells";
import { staffDisplayName } from "@/lib/staff-display";
import { cn } from "@/lib/utils";

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
  pickers: Record<string, RosterPickerGroup[]>;
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
  /** Per-staff shift counts from earlier weeks, for the picker's "Thường làm"
   *  shortcut. Missing entry = no history, section is skipped. */
  shiftUsage: ShiftUsageByStaff;
  /** Approved leave for the week, keyed `${staffId}::${dateISO}` → leave type. */
  leaveByDay: Record<string, string>;
  /** Shift slots each band must cover per day, keyed by band id. 0 = no
   *  requirement recorded, so that band shows a bare count. */
  bandRequired: Record<string, number>;
  /** Render each shift's time line on the chips and in the picker. */
  showTimes: boolean;
  /** Open the staff detail form for this row. */
  onOpenStaff: (staff: StaffRecord) => void;
  /** Pull just this staffer's shifts forward from last week. */
  onCopyStaffWeek: (staffId: string) => void;
  /** True while a copy is in flight, so the row buttons can't stack up. */
  copyPending?: boolean;
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
  shiftUsage,
  leaveByDay,
  bandRequired,
  showTimes,
  onOpenStaff,
  onCopyStaffWeek,
  copyPending = false,
}: RosterGridProps) {
  // +3: row number, staff name, and the trailing weekly-hours column.
  const colSpan = days.length + 3;
  const paidHoursOf = (shiftId: string) => defs[shiftId]?.paidHours ?? 0;
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
      <table className="w-full min-w-[898px] table-fixed border-collapse">
        <thead>
          {/* Weekday header sticks to the top of the scroll box so the day each
              cell belongs to stays visible while scrolling the roster. */}
          <tr className="bg-navy-deep">
            <th className="sticky top-0 z-30 h-[46px] w-[34px] border-b border-line bg-navy-deep px-[6px] py-[11px] text-center text-[11.5px] font-bold text-sidebar-idle">
              #
            </th>
            <th className="sticky top-0 z-30 h-[46px] w-[212px] border-b border-line bg-navy-deep px-3 py-[11px] text-left text-[11.5px] font-bold uppercase tracking-[0.4px] text-toggle-track">
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
            <th className="sticky top-0 z-30 h-[46px] w-[78px] border-b border-b-line border-l border-l-sidebar-border bg-navy-deep px-1 py-[11px] text-center text-[11.5px] font-bold uppercase tracking-[0.4px] text-toggle-track">
              Hours
              <div className="text-[10px] font-medium normal-case tracking-normal text-sidebar-muted">
                This week
              </div>
            </th>
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
            <td className="border-l border-line-divider" />
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
                  <tr key={st.id} className="group border-b border-line-divider">
                    <td className="text-center text-[12.5px] font-semibold text-ink-faint">
                      {bandOffsets[bi] + si + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-[9px]">
                        {/* Avatar + name open that person's detail form. Whole
                            thing is one target so it stays easy to hit; names
                            wrap rather than truncate, since several staff share
                            a first name and a clipped "Tran Quynh…" is worse
                            than a two-line row. */}
                        <button
                          type="button"
                          onClick={() => onOpenStaff(st)}
                          title={`Mở thông tin ${staffDisplayName(st)}`}
                          className="flex min-w-0 flex-1 items-center gap-[9px] rounded-[8px] text-left hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                        >
                          <PersonBadge
                            initials={st.initials}
                            color={st.color}
                            className="size-[30px] rounded-full text-[11px]"
                          />
                          <span className="min-w-0 flex-1 text-[13.5px] font-semibold leading-[1.25] text-ink underline decoration-transparent underline-offset-2 group-hover:decoration-line-strong">
                            {staffDisplayName(st)}
                          </span>
                        </button>
                        {/* Stays out of the way until the row is hovered or the
                            button itself is focused, so the name column doesn't
                            carry a control on all 26 rows at once. */}
                        <button
                          type="button"
                          onClick={() => onCopyStaffWeek(st.id)}
                          disabled={copyPending}
                          title={`Chép ca tuần trước cho ${staffDisplayName(st)}`}
                          aria-label={`Chép ca tuần trước cho ${staffDisplayName(st)}`}
                          className="shrink-0 rounded-[7px] border border-line-soft bg-cream-2 px-[7px] py-[3px] text-[12px] font-semibold text-ink-nav opacity-0 transition-opacity hover:bg-cream focus-visible:opacity-100 disabled:cursor-not-allowed group-hover:opacity-100"
                        >
                          ⟲
                        </button>
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
                          usage={shiftUsage[st.id] ?? []}
                          showTimes={showTimes}
                          leaveType={leaveByDay[cellKey]}
                          staffName={staffDisplayName(st)}
                          dayLabel={`${d.dow} ${d.date}`}
                          isOpen={openCell === cellKey}
                          onOpen={onOpen}
                          onClose={onClose}
                          onToggle={onToggle}
                          onClear={onClear}
                        />
                      );
                    })}
                    <StaffHoursCell
                      staffId={st.id}
                      days={days}
                      grid={grid}
                      paidHoursOf={paidHoursOf}
                      name={staffDisplayName(st)}
                    />
                  </tr>
              ))}
              {/* Per-day coverage for this band: how many shifts its staff are
                  assigned that day, against how many the band's shift templates
                  say it needs (summed `req`). Short days are called out so an
                  under-covered day is visible without counting chips. */}
              <tr className="border-b-2 border-line" style={{ background: band.tint }}>
                <td
                  colSpan={2}
                  className="px-3 py-[6px] text-right text-[11px] font-bold uppercase tracking-[0.4px]"
                  style={{ color: band.color }}
                >
                  Ca đã xếp / cần
                </td>
                {days.map((d) => {
                  const assigned = band.staff.reduce(
                    (n, st) => n + (grid[rosterCellKey(st.id, d.iso)]?.length ?? 0),
                    0,
                  );
                  const required = bandRequired[band.id] ?? 0;
                  const short = required > 0 && assigned < required;
                  return (
                    <td
                      key={d.iso}
                      title={
                        required > 0
                          ? `${assigned} ca đã xếp trên ${required} ca cần cho ${band.label} · ${d.dow} ${d.date}`
                          : `${assigned} ca đã xếp cho ${band.label} · ${d.dow} ${d.date} (chưa đặt mức cần)`
                      }
                      className={cn(
                        "border-l border-line-divider px-1 py-[6px] text-center text-[12px] tabular-nums",
                        short ? "font-bold text-rust" : "font-semibold text-ink-soft",
                      )}
                    >
                      {assigned}
                      {required > 0 && (
                        <span className="font-medium text-ink-faint">/{required}</span>
                      )}
                    </td>
                  );
                })}
                <BandHoursCell
                  band={band}
                  days={days}
                  grid={grid}
                  paidHoursOf={paidHoursOf}
                />
              </tr>
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
            <WeekHoursCell
              bands={bands}
              days={days}
              grid={grid}
              paidHoursOf={paidHoursOf}
            />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
