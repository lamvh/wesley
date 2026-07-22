import type {
  DutyForm,
  DutyOption,
  DutyRow,
  DutySection,
  DutySheet,
  RoleDef,
  RoleGroup,
  RosterDay,
  RosterGrid,
  ShiftType,
  StaffRecord,
} from "@/types/domain";
import { rosterCellKey } from "@/types/domain";
import type { RosterBand } from "@/lib/roster-grouping";
import { isKitchen } from "@/lib/today-board";

// Design default is "day" (.design-src, `dutyForm: { scope: pick('dutyScope', 'day'), ... }`) -
// opening the export modal and printing without touching the scope toggle
// must yield the single current day (1 page), not the whole week (up to 7).
export const DUTY_DEFAULTS: DutyForm = { scope: "day", day: 0 };

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

const byStart = (a: DutyRow, b: DutyRow) => startMinutes(a.time) - startMinutes(b.time);

// Band shown for a shift whose role maps to no group (or is unrestricted).
const UNGROUPED_LABEL = "Unassigned";

// Build one print-ready duty sheet per day in the chosen scope, off the live
// roster. Each assigned shift is placed by the group of *its own role* (the
// shift template's role → RoleDef.groupId → RoleGroup), NOT by the staffer's
// roster band — a staffer who works a shift outside their band lands under that
// shift's group. Bands render in group order; each splits into per-building
// columns (Wesley left / The Lodge right). Kitchen groups collapse into one
// shared band (no per-building split), matching the public /today board so both
// render the same document. Shifts whose role maps to no group fall into a
// trailing "Unassigned" band. Empty bands + the day's on-call name are handled
// the same. `bands` supplies the staff roster (grid rows) to walk.
export function buildDutySheets(
  bands: RosterBand[],
  days: RosterDay[],
  grid: RosterGrid,
  shiftTypes: ShiftType[],
  roles: RoleDef[],
  groups: RoleGroup[],
  form: DutyForm,
  onCallNameByDay: Record<string, string> = {},
): DutySheet[] {
  const defs = Object.fromEntries(shiftTypes.map((s) => [s.id, s]));
  const roleToGroup = new Map(roles.map((r) => [r.name, r.groupId]));
  const groupOrder = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const kitchenGroupIds = new Set(groups.filter((g) => isKitchen(g.label)).map((g) => g.id));
  const allStaff = bands.flatMap((b) => b.staff);

  const scopeDays =
    form.scope === "day" ? [days[form.day] ?? days[0]].filter(Boolean) : days;

  return scopeDays.map((day) => {
    // Buckets keyed by group id, plus a shared kitchen list and an ungrouped
    // catch-all — each shift line drops into the bucket of its own role's group.
    const wesleyByGroup = new Map<string, DutyRow[]>();
    const lodgeByGroup = new Map<string, DutyRow[]>();
    const kitchen: DutyRow[] = [];
    const ungroupedWesley: DutyRow[] = [];
    const ungroupedLodge: DutyRow[] = [];

    const push = (map: Map<string, DutyRow[]>, key: string, row: DutyRow) => {
      (map.get(key) ?? map.set(key, []).get(key)!).push(row);
    };

    for (const st of allStaff) {
      for (const id of grid[rosterCellKey(st.id, day.iso)] ?? []) {
        const d = defs[id];
        if (!d) continue;
        const gid = d.role ? roleToGroup.get(d.role) ?? null : null;
        // A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints one line
        // per segment. Each line lands in the column of its building (Lodge
        // right, else Wesley left) — except kitchen groups, which share one list.
        for (const tm of String(d.time || d.label).split(" + ")) {
          const row = { time: tm, name: st.name };
          if (gid && kitchenGroupIds.has(gid)) {
            kitchen.push(row);
          } else if (gid) {
            push(d.building === "lodge" ? lodgeByGroup : wesleyByGroup, gid, row);
          } else if (d.building === "lodge") {
            ungroupedLodge.push(row);
          } else {
            ungroupedWesley.push(row);
          }
        }
      }
    }

    const sections: DutySection[] = [];
    for (const g of groupOrder) {
      if (kitchenGroupIds.has(g.id)) continue; // kitchen renders as its own band
      const wesley = (wesleyByGroup.get(g.id) ?? []).sort(byStart);
      const lodge = (lodgeByGroup.get(g.id) ?? []).sort(byStart);
      if (wesley.length > 0 || lodge.length > 0) sections.push({ label: g.label, wesley, lodge });
    }
    if (ungroupedWesley.length > 0 || ungroupedLodge.length > 0) {
      sections.push({
        label: UNGROUPED_LABEL,
        wesley: ungroupedWesley.sort(byStart),
        lodge: ungroupedLodge.sort(byStart),
      });
    }
    kitchen.sort(byStart);
    return { dateLabel: sheetDateLabel(day), onCall: onCallNameByDay[day.iso] ?? "", sections, kitchen };
  });
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
