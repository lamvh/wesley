import type { Building } from "@/types/domain";

const buildings: Building[] = [
  { id: "wesley", name: "Wesley", full: "Victoria at Mt Eden", suburb: "Mt Eden, Auckland", wings: ["Kōwhai", "Rātā", "Tōtara"], suites: 54, occupied: 51, staff: 38, mgr: "Sarah Beckett", color: "#2C3563", tint: "#E4E6F2", initials: "W" },
  { id: "lodge", name: "The Lodge", full: "The Lodge at Epsom", suburb: "Epsom, Auckland", wings: ["Willow", "Manuka"], suites: 32, occupied: 29, staff: 22, mgr: "Michael Tanner", color: "#3d6b74", tint: "#DEEAEC", initials: "L" },
];

export function getBuildings(): Building[] {
  return buildings;
}

export function getBuildingById(id: string): Building {
  return buildings.find((b) => b.id === id) ?? buildings[0];
}

export function occupancyPct(b: Building): number {
  return Math.round((b.occupied / b.suites) * 100);
}
