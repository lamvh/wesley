import type { DutyRow, DutySection, TodayDutyRow, TodayBoardSheet } from "@/types/domain";

// Display band order for the public board. Each entry matches one or more raw
// staff.role values (case-insensitive substring). Kitchen is handled separately.
const BANDS: { label: string; match: string[] }[] = [
  { label: "NURSE", match: ["nurse", "rn"] },
  { label: "A/C", match: ["a/c", "associate", "charge"] },
  { label: "HCA", match: ["hca", "healthcare", "carer", "care assistant"] },
  { label: "CARE TAKER", match: ["care taker", "caretaker", "ct"] },
];
const KITCHEN = ["kitchen", "chef", "cook", "kit"];
const CHEF = ["chef", "cook"];

function bandIndex(role: string): number {
  const r = role.toLowerCase();
  for (let i = 0; i < BANDS.length; i++) {
    if (BANDS[i].match.some((m) => r.includes(m))) return i;
  }
  return -1;
}

// True when a role (or a roster band label) reads as kitchen — shared by the
// export builder so both group kitchen the same way.
export function isKitchen(role: string): boolean {
  const r = role.toLowerCase();
  return KITCHEN.some((m) => r.includes(m));
}

// True when a role reads as the chef - the kitchen band lists the chef first,
// ahead of kitchen hands, regardless of shift start time.
export function isChef(role: string): boolean {
  const r = role.toLowerCase();
  return CHEF.some((m) => r.includes(m));
}

// A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints one line per
// segment, matching the design.
function segments(time: string): string[] {
  return String(time).split(" + ");
}

// Group raw rows into the design's bands (Nurse/A-C/HCA/Care Taker) + Kitchen,
// each split into Wesley (left) and Lodge (right) columns. Roles that match no
// band fall into a trailing "OTHER" band so nobody is dropped. `onCallRows` is
// the today_on_call rpc result - Wesley only, since that's the only building
// the on-call picker tracks (mirrors the roster grid's on-call feature).
export function buildTodayBoard(
  rows: TodayDutyRow[],
  onCallRows: { buildingId: string; name: string }[] = [],
): TodayBoardSheet {
  const sections: DutySection[] = BANDS.map((b) => ({ label: b.label, wesley: [], lodge: [] }));
  const other: DutySection = { label: "OTHER", wesley: [], lodge: [] };
  // Tagged with `chef` so the kitchen band can list the chef first below,
  // ahead of kitchen hands, without changing the DutyRow shape it renders.
  const kitchen: { row: DutyRow; chef: boolean }[] = [];

  for (const row of rows) {
    if (isKitchen(row.role)) {
      const chef = isChef(row.role);
      for (const t of segments(row.time)) kitchen.push({ row: { time: t, name: row.name }, chef });
      continue;
    }
    const idx = bandIndex(row.role);
    const band = idx >= 0 ? sections[idx] : other;
    const col = row.buildingId === "lodge" ? band.lodge : band.wesley;
    for (const t of segments(row.time)) col.push({ time: t, name: row.name });
  }

  kitchen.sort((a, b) => Number(b.chef) - Number(a.chef));
  const out = [...sections, other].filter((b) => b.wesley.length > 0 || b.lodge.length > 0);
  const onCall = onCallRows.find((r) => r.buildingId === "wesley")?.name ?? "";
  return { sections: out, kitchen: kitchen.map((k) => k.row), onCall };
}
