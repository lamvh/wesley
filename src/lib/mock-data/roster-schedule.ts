import type {
  DutyBuilding,
  DutyCategory,
  DutyForm,
  DutyOption,
  DutyRow,
  DutySection,
  DutySheet,
  RosterDay,
  RosterGrid,
  RosterStaff,
  ShiftType,
} from "@/types/domain";

// Shift types keyed by id (matches the design's shiftDefs). Ordered for the legend/picker.
export const SHIFT_ORDER = [
  "m", "ms", "d", "mid", "e", "a", "la", "ev", "n", "nl", "tld", "tll", "k", "kl",
] as const;

const shiftDefs: Record<string, ShiftType> = {
  m: { id: "m", code: "M", label: "Morning", time: "6:45–15:15", color: "#87651A", tint: "#FCF4DC", border: "#EAD9A4" },
  ms: { id: "ms", code: "M/Stock", label: "Morning + Stock", time: "6:45–17:15", color: "#8A6516", tint: "#FBEFC8", border: "#E7CE8A" },
  d: { id: "d", code: "Day", label: "Day", time: "8:00–16:30", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  mid: { id: "mid", code: "Mid", label: "Mid", time: "11:30–20:00", color: "#3d6b74", tint: "#DEEAEC", border: "#9FC5D4" },
  e: { id: "e", code: "E", label: "Evening (split)", time: "8:30–18:00 + 18:00–21:00", color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  a: { id: "a", code: "A", label: "Afternoon", time: "14:45–22:15", color: "#9A4A70", tint: "#F7DFEA", border: "#E5B2CB" },
  la: { id: "la", code: "A/Late", label: "Afternoon (late)", time: "14:45–23:15", color: "#8A3F63", tint: "#F3DBE7", border: "#E0A9C4" },
  ev: { id: "ev", code: "Ev", label: "Evening", time: "16:00–21:00", color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  n: { id: "n", code: "N", label: "Night", time: "23:45–8:15", color: "#3B4E74", tint: "#E3E8F5", border: "#B4C1DF" },
  nl: { id: "nl", code: "N/Early", label: "Night (early)", time: "22:45–7:15", color: "#34456A", tint: "#DFE5F3", border: "#B4C1DF" },
  tld: { id: "tld", code: "TL · Day", label: "Team Leader — day", time: "8:00–15:30", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  tll: { id: "tll", code: "TL · Late", label: "Team Leader — late", time: "16:15–22:45", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  k: { id: "k", code: "Kitchen", label: "Kitchen", time: "7:00–18:00", color: "#6E5A2A", tint: "#F0E7CE", border: "#D8C48E" },
  kl: { id: "kl", code: "Kit·Late", label: "Kitchen (late)", time: "16:00–19:00", color: "#6E5A2A", tint: "#F0E7CE", border: "#D8C48E" },
};

// 18 staff across two buildings. `duty` groups them on the exported duty sheet;
// `building` splits each duty section into Wesley (left) / The Lodge (right).
const rosterStaff: RosterStaff[] = [
  { name: "Rosaline Su", pos: "RN", duty: "nurse", building: "wesley", initials: "RS", color: "#6E875E" },
  { name: "Ivan Petrov", pos: "RN", duty: "nurse", building: "wesley", initials: "IV", color: "#8a6ba3" },
  { name: "Jo Lin Zhang", pos: "A/C", duty: "ac", building: "wesley", initials: "JZ", color: "#c08a3e" },
  { name: "Lusi Tui", pos: "HCA", duty: "hca", building: "wesley", initials: "LT", color: "#5b8f9a" },
  { name: "Minn Aung", pos: "HCA", duty: "hca", building: "wesley", initials: "MA", color: "#b06a5a" },
  { name: "May Htet", pos: "HCA", duty: "hca", building: "wesley", initials: "MH", color: "#7e9b6a" },
  { name: "Tien Nguyen", pos: "HCA", duty: "hca", building: "wesley", initials: "TN", color: "#3d6b74" },
  { name: "Helen Le", pos: "CT", duty: "ct", building: "wesley", initials: "HL", color: "#BE7350" },
  { name: "Tango Ngo", pos: "CT", duty: "ct", building: "wesley", initials: "TG", color: "#6E875E" },
  { name: "Candy Tian", pos: "CT", duty: "ct", building: "wesley", initials: "CT", color: "#9a7b4f" },
  { name: "Lan Le", pos: "CT", duty: "ct", building: "wesley", initials: "LL", color: "#6e879e" },
  { name: "Long Do", pos: "KIT", duty: "kitchen", building: "wesley", initials: "LD", color: "#a86b3e" },
  { name: "Minh Dao", pos: "KIT", duty: "kitchen", building: "wesley", initials: "MD", color: "#8A6516" },
  { name: "Siolata Fifita", pos: "RN", duty: "nurse", building: "lodge", initials: "SF", color: "#9A4A70" },
  { name: "David Trung", pos: "HCA", duty: "hca", building: "lodge", initials: "DT", color: "#2C5A6E" },
  { name: "Tony Wu", pos: "HCA", duty: "hca", building: "lodge", initials: "TW", color: "#5b8f9a" },
  { name: "Julia Kim", pos: "HCA", duty: "hca", building: "lodge", initials: "JK", color: "#b06a5a" },
  { name: "Duy Nguyen", pos: "CT", duty: "ct", building: "lodge", initials: "DN", color: "#6E875E" },
];

const rosterDays: RosterDay[] = [
  { dow: "Mon", date: "13" }, { dow: "Tue", date: "14" }, { dow: "Wed", date: "15" },
  { dow: "Thu", date: "16" }, { dow: "Fri", date: "17" }, { dow: "Sat", date: "18" }, { dow: "Sun", date: "19" },
];

export const ROSTER_WEEK_TITLE = "STAFF ROSTER · 13/07 – 19/07";

// Default assignments — one row per staff member, 7 day columns. Arrays hold
// multiple shifts in one cell (e.g. a team leader doing day + late).
const defaultRows: (string | string[] | null)[][] = [
  ["m", "m", null, "m", "m", null, "la"],
  ["la", null, "la", "la", null, "m", "m"],
  ["d", "d", "d", null, "d", "d", null],
  ["m", "m", null, "m", null, "m", "mid"],
  ["mid", "mid", "mid", null, "mid", null, "m"],
  ["la", null, "la", "la", "la", null, "la"],
  ["nl", "nl", null, "nl", null, "nl", "nl"],
  ["ms", "ms", "ms", null, "ms", null, "ms"],
  ["e", "e", null, "e", "e", null, "e"],
  ["a", "a", "a", null, "a", null, "a"],
  ["n", "n", null, null, "n", "n", null],
  ["k", "k", "k", "k", "k", null, "k"],
  ["kl", "kl", null, "kl", "kl", "kl", null],
  ["m", "m", "m", null, "m", null, "m"],
  ["m", null, "m", "m", null, "m", "m"],
  ["ev", "ev", null, "ev", "ev", null, "ev"],
  ["nl", "nl", "nl", null, "nl", "nl", null],
  [["tld", "tll"], "tld", "tll", "tld", ["tld", "tll"], null, "tld"],
];

export function getShiftDefs(): Record<string, ShiftType> {
  return shiftDefs;
}

export function getShiftLegend(): ShiftType[] {
  return SHIFT_ORDER.map((id) => shiftDefs[id]);
}

export function getRosterStaff(): RosterStaff[] {
  return rosterStaff;
}

export function getRosterDays(): RosterDay[] {
  return rosterDays;
}

export function getDefaultRosterGrid(): RosterGrid {
  const grid: RosterGrid = {};
  defaultRows.forEach((row, ri) =>
    row.forEach((cell, ci) => {
      if (cell) grid[`${ri}-${ci}`] = Array.isArray(cell) ? [...cell] : [cell];
    }),
  );
  return grid;
}

/** staff-on-duty count per day column. */
export function dailyTotals(staffCount: number, days: number, grid: RosterGrid): number[] {
  return Array.from({ length: days }, (_, ci) => {
    let n = 0;
    for (let ri = 0; ri < staffCount; ri++) if ((grid[`${ri}-${ci}`] ?? []).length) n++;
    return n;
  });
}

export function totalShifts(grid: RosterGrid): number {
  return Object.values(grid).reduce((acc, ids) => acc + ids.length, 0);
}

// ---- duty roster export (a clean print sheet derived from the shift grid) ----

/** Ordered duty categories printed on each sheet (kitchen renders separately). */
const DUTY_SECTIONS: { key: DutyCategory; label: string }[] = [
  { key: "nurse", label: "NURSE" },
  { key: "ac", label: "A/C" },
  { key: "hca", label: "HCA" },
  { key: "ct", label: "CARE TAKER" },
];

export const DUTY_DEFAULTS: DutyForm = {
  scope: "day",
  day: 0,
  onCall: "Siolata Fifita",
  chef: "Long Do",
};

// One printed line per shift-time segment; split shifts (" + ") expand to two.
function dutyRowsFor(grid: RosterGrid, ci: number, duty: DutyCategory, building: DutyBuilding): DutyRow[] {
  const out: DutyRow[] = [];
  rosterStaff.forEach((st, ri) => {
    if (st.duty !== duty || st.building !== building) return;
    (grid[`${ri}-${ci}`] ?? []).forEach((id) => {
      const def = shiftDefs[id];
      if (!def) return;
      def.time.split(" + ").forEach((tm) => out.push({ time: tm, name: st.name.toUpperCase() }));
    });
  });
  return out;
}

function dutyKitchenFor(grid: RosterGrid, ci: number): DutyRow[] {
  const out: DutyRow[] = [];
  rosterStaff.forEach((st, ri) => {
    if (st.duty !== "kitchen") return;
    (grid[`${ri}-${ci}`] ?? []).forEach((id) => {
      const def = shiftDefs[id];
      if (!def) return;
      def.time.split(" + ").forEach((tm) => out.push({ time: tm, name: st.name.toUpperCase() }));
    });
  });
  return out;
}

/** Build the printable duty sheets for the chosen scope (one sheet per day). */
export function buildDutySheets(grid: RosterGrid, form: DutyForm): DutySheet[] {
  const idxs =
    form.scope === "week"
      ? rosterDays.map((_, i) => i)
      : [Math.min(rosterDays.length - 1, Math.max(0, form.day || 0))];
  return idxs.map((ci) => {
    const d = rosterDays[ci];
    const dateLabel = `${d.dow} ${`0${d.date}`.slice(-2)}/07/26`.toUpperCase();
    const sections: DutySection[] = DUTY_SECTIONS.map((sec) => {
      const wesley = dutyRowsFor(grid, ci, sec.key, "wesley");
      const lodge = dutyRowsFor(grid, ci, sec.key, "lodge");
      return { label: sec.label, wesley, lodge, wEmpty: wesley.length === 0, lEmpty: lodge.length === 0 };
    });
    const kitchen = dutyKitchenFor(grid, ci);
    return {
      dateLabel,
      onCall: (form.onCall || "—").toUpperCase(),
      chef: (form.chef || "—").toUpperCase(),
      sections,
      kitchen,
      kitchenEmpty: kitchen.length === 0,
    };
  });
}

export function getDutyDayOptions(): DutyOption[] {
  return rosterDays.map((d, i) => ({ value: String(i), label: `${d.dow} ${d.date} Jul` }));
}

export function getDutyStaffOptions(): DutyOption[] {
  return rosterStaff.map((st) => ({ value: st.name, label: `${st.name} · ${st.pos}` }));
}

/** Toolbar title for the print preview ("Tue 14 Jul" or "Full week · …"). */
export function getDutySheetTitle(form: DutyForm): string {
  if (form.scope === "week") return "Full week · 13–19 Jul";
  const d = rosterDays[Math.min(rosterDays.length - 1, Math.max(0, form.day || 0))] ?? rosterDays[0];
  return `${d.dow} ${d.date} Jul`;
}
