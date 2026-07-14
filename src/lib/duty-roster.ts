import type {
  DutyForm,
  DutyOption,
  DutySheet,
  RosterDay,
  RosterGrid,
  ShiftType,
  StaffRecord,
} from "@/types/domain";
import { rosterCellKey } from "@/types/domain";
import type { RosterBand } from "@/lib/roster-grouping";

export const DUTY_DEFAULTS: Omit<DutyForm, "onCall" | "chef"> = { scope: "week", day: 0 };

// Leading start time of a shift ("6:45 – 15:15" -> 405 minutes) so lines sort
// by when the shift starts rather than lexically. Unparseable -> end of list.
function startMinutes(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return 24 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

function dayLabel(d: RosterDay): string {
  return `${d.dow} ${d.date} ${d.month}`;
}

// Build one print-ready duty sheet per day in the chosen scope, off the live
// roster: each role band lists the staff assigned that day with their shift
// time. On-call + chef names come from the export form. Empty bands are dropped.
export function buildDutySheets(
  bands: RosterBand[],
  days: RosterDay[],
  grid: RosterGrid,
  shiftTypes: ShiftType[],
  form: DutyForm,
): DutySheet[] {
  const defs = Object.fromEntries(shiftTypes.map((s) => [s.id, s]));
  const scopeDays =
    form.scope === "day" ? [days[form.day] ?? days[0]].filter(Boolean) : days;

  return scopeDays.map((day) => ({
    dateLabel: dayLabel(day),
    onCall: form.onCall,
    chef: form.chef,
    sections: bands
      .map((band) => {
        const rows = band.staff
          .flatMap((st) => {
            const ids = grid[rosterCellKey(st.id, day.iso)] ?? [];
            return ids
              .map((id) => defs[id])
              .filter(Boolean)
              .map((d) => ({ time: d.time || d.label, name: st.name }));
          })
          .sort((a, b) => startMinutes(a.time) - startMinutes(b.time));
        return { label: band.label, color: band.color, rows };
      })
      .filter((s) => s.rows.length > 0),
  }));
}

// Title shown on the preview toolbar: a single day, or the week's Mon–Sun span.
export function dutySheetTitle(days: RosterDay[], form: DutyForm): string {
  if (form.scope === "day") {
    const d = days[form.day] ?? days[0];
    return d ? dayLabel(d) : "";
  }
  const first = days[0];
  const last = days[days.length - 1];
  return first && last ? `${first.date} ${first.month} – ${last.date} ${last.month}` : "";
}

export function dutyDayOptions(days: RosterDay[]): DutyOption[] {
  return days.map((d, i) => ({ value: String(i), label: dayLabel(d) }));
}

export function dutyStaffOptions(staff: StaffRecord[]): DutyOption[] {
  return staff.map((s) => ({ value: s.name, label: s.name }));
}
