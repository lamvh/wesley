import type { TodayDutyRow, TodayBand, TodayBoardSheet } from "@/types/domain";

// Display band order for the public board. Each entry matches one or more raw
// staff.role values (case-insensitive substring). Kitchen is handled separately.
const BANDS: { label: string; match: string[] }[] = [
  { label: "NURSE", match: ["nurse", "rn"] },
  { label: "A/C", match: ["a/c", "associate", "charge"] },
  { label: "HCA", match: ["hca", "healthcare", "carer", "care assistant"] },
  { label: "CARE TAKER", match: ["care taker", "caretaker", "ct"] },
];
const KITCHEN = ["kitchen", "chef", "cook", "kit"];

function bandIndex(role: string): number {
  const r = role.toLowerCase();
  for (let i = 0; i < BANDS.length; i++) {
    if (BANDS[i].match.some((m) => r.includes(m))) return i;
  }
  return -1;
}

function isKitchen(role: string): boolean {
  const r = role.toLowerCase();
  return KITCHEN.some((m) => r.includes(m));
}

// A dual-segment shift ("6:45 – 15:15 + 18:00 – 21:00") prints one line per
// segment, matching the design.
function segments(time: string): string[] {
  return String(time).split(" + ");
}

// Group raw rows into the design's bands (Nurse/A-C/HCA/Care Taker) + Kitchen,
// each split into Wesley (left) and Lodge (right) columns. Roles that match no
// band fall into a trailing "OTHER" band so nobody is dropped.
export function buildTodayBoard(rows: TodayDutyRow[]): TodayBoardSheet {
  const sections: TodayBand[] = BANDS.map((b) => ({ label: b.label, wesley: [], lodge: [] }));
  const other: TodayBand = { label: "OTHER", wesley: [], lodge: [] };
  const kitchen: { time: string; name: string }[] = [];

  for (const row of rows) {
    if (isKitchen(row.role)) {
      for (const t of segments(row.time)) kitchen.push({ time: t, name: row.name });
      continue;
    }
    const idx = bandIndex(row.role);
    const band = idx >= 0 ? sections[idx] : other;
    const col = row.buildingId === "lodge" ? band.lodge : band.wesley;
    for (const t of segments(row.time)) col.push({ time: t, name: row.name });
  }

  const out = [...sections, other].filter((b) => b.wesley.length > 0 || b.lodge.length > 0);
  return { sections: out, kitchen };
}
