import type {
  DutyForm,
  DutyOption,
  DutyRow,
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

// Print-sheet date stamp: "MON 13/07/26" (caps day-of-week + dd/mm/yy off the ISO
// date), distinct from the friendly dayLabel used in the modal selects/toolbar.
function sheetDateLabel(d: RosterDay): string {
  const [y, m, day] = d.iso.split("-");
  return `${d.dow.toUpperCase()} ${day}/${m}/${y.slice(2)}`;
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
    dateLabel: sheetDateLabel(day),
    onCall: form.onCall,
    chef: form.chef,
    sections: bands
      .map((band) => {
        const wesley: DutyRow[] = [];
        const lodge: DutyRow[] = [];
        for (const st of band.staff) {
          const ids = grid[rosterCellKey(st.id, day.iso)] ?? [];
          for (const id of ids) {
            const d = defs[id];
            if (!d) continue;
            // A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints as one
            // line per segment, matching how the sheet reads on paper. Each line
            // lands in the column of the shift's building (Lodge right, else left).
            const col = d.building === "lodge" ? lodge : wesley;
            for (const tm of String(d.time || d.label).split(" + ")) {
              col.push({ time: tm, name: st.name });
            }
          }
        }
        const byStart = (a: DutyRow, b: DutyRow) => startMinutes(a.time) - startMinutes(b.time);
        wesley.sort(byStart);
        lodge.sort(byStart);
        return { label: band.label, wesley, lodge };
      })
      .filter((s) => s.wesley.length > 0 || s.lodge.length > 0),
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
