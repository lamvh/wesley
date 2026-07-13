import type { Room, RoomStatus, SupplyItem, Wing } from "@/types/domain";

// Standard per-room supply defs (name, qty, par, unit) — attached to any
// occupied room. Status/pct are derived downstream from qty/par.
const roomSupplyDefs: [string, number, number, string][] = [
  ["Continence briefs (M)", 18, 24, "packs"],
  ["Bed pads", 30, 30, "packs"],
  ["Nitrile gloves (M)", 3, 10, "boxes"],
  ["Personal wipes", 12, 12, "packs"],
];

export const roomSupplies: SupplyItem[] = roomSupplyDefs.map(
  ([name, qty, par, unit]) => ({ name, qty, par, unit }),
);

// Weekly activity headline per wing (occupied rooms only).
export const actsByWing: Record<Wing, string[]> = {
  Rātā: ["Garden group · 9:30am", "Gentle exercise · 11:00am", "Choir & singalong · 2:00pm"],
  Kōwhai: ["Chair yoga · 11:30am", "Piano & singalong · 2:30pm", "Happy hour · 3:00pm"],
  Tōtara: ["Waiata & kapa haka · 11:00am", "Sensory garden · 1:30pm", "Music & movement · 3:00pm"],
};

interface RoomSeed {
  num: string;
  wing: Wing;
  status: RoomStatus;
  careType: Room["careType"];
  resident?: { name: string; initials: string; color: string; diet: string; mobility: string };
  note: string;
  house: string;
}

export const roomSeed: RoomSeed[] = [
  { num: "05", wing: "Rātā", status: "Occupied", careType: "Rest Home", resident: { name: "Patricia Vaughan", initials: "PV", color: "#7e9b6a", diet: "Vegetarian", mobility: "Independent" }, note: "Runs the Thursday craft circle. Independent and active.", house: "Housekeeping daily · linens Tue & Fri" },
  { num: "07", wing: "Rātā", status: "Occupied", careType: "Rest Home", resident: { name: "Henry Fitzgerald", initials: "HF", color: "#BE7350", diet: "Diabetic", mobility: "Independent" }, note: "Post-fall hourly observations until 6pm.", house: "Housekeeping daily · linens Tue & Fri" },
  { num: "12", wing: "Rātā", status: "Occupied", careType: "Rest Home", resident: { name: "Margaret “Peggy” Whitcombe", initials: "MW", color: "#6E875E", diet: "Soft, no nuts", mobility: "Walking frame" }, note: "Falls watch. GP medication review due with Dr Anaru.", house: "Housekeeping daily · linens Tue & Fri" },
  { num: "15", wing: "Rātā", status: "Occupied", careType: "Rest Home", resident: { name: "Joan Ferris", initials: "JF", color: "#6e879e", diet: "Gluten free", mobility: "Walking frame" }, note: "Former church organist — loves the Sunday service.", house: "Housekeeping daily · linens Tue & Fri" },
  { num: "09", wing: "Rātā", status: "Available", careType: "Rest Home", note: "Deep-cleaned and ready. Available for admission now.", house: "Turned over 9 Jul · inspected" },
  { num: "03", wing: "Rātā", status: "Maintenance", careType: "Rest Home", note: "Bathroom grab-rail repair. Joiner booked Monday 13 Jul.", house: "Out of service until repair signed off" },
  { num: "18", wing: "Kōwhai", status: "Occupied", careType: "Hospital", resident: { name: "William “Bill” Toop", initials: "WT", color: "#5b8f9a", diet: "Normal", mobility: "Wheelchair" }, note: "Prefers the window seat and the resident cat, Miso.", house: "Housekeeping daily · linens daily" },
  { num: "21", wing: "Kōwhai", status: "Occupied", careType: "Hospital", resident: { name: "Dorothy Nguyen", initials: "DN", color: "#8a6ba3", diet: "Puree, thickened", mobility: "Hoist transfer" }, note: "Enjoys being read to and 1950s jazz in the afternoons.", house: "Housekeeping daily · linens daily" },
  { num: "24", wing: "Kōwhai", status: "Occupied", careType: "Hospital", resident: { name: "George Aleki", initials: "GA", color: "#b06a5a", diet: "Normal", mobility: "Walking stick" }, note: "Settled in beautifully — loves the choir and a game of cards.", house: "Housekeeping daily · linens daily" },
  { num: "22", wing: "Kōwhai", status: "Occupied", careType: "Hospital", resident: { name: "Alan Petera", initials: "AP", color: "#6e879e", diet: "Normal", mobility: "Wheelchair" }, note: "New admission 6 Jul. Settling in well with the team.", house: "Housekeeping daily · linens daily" },
  { num: "20", wing: "Kōwhai", status: "Available", careType: "Hospital", note: "Premium room available — ground floor, private ensuite, garden view.", house: "Turned over 8 Jul · inspected" },
  { num: "30", wing: "Tōtara", status: "Occupied", careType: "Dementia", resident: { name: "Ngaire Thompson", initials: "NT", color: "#c08a3e", diet: "Finger foods", mobility: "Independent" }, note: "Settles best with music, movement and gentle routine.", house: "Housekeeping daily · linens Mon & Thu" },
  { num: "33", wing: "Tōtara", status: "Occupied", careType: "Dementia", resident: { name: "Robert “Bob” McKenzie", initials: "RM", color: "#9a7b4f", diet: "Soft", mobility: "Walking frame" }, note: "Likes to keep busy — tactile activities and courtyard walks.", house: "Housekeeping daily · linens Mon & Thu" },
  { num: "31", wing: "Tōtara", status: "Occupied", careType: "Dementia", resident: { name: "Tom Rewiti", initials: "TR", color: "#6E875E", diet: "Normal", mobility: "Independent" }, note: "Enjoys courtyard walks and afternoon waiata.", house: "Housekeeping daily · linens Mon & Thu" },
  { num: "32", wing: "Tōtara", status: "Available", careType: "Dementia", note: "VIP suite available — our largest room, garden views, private ensuite.", house: "Turned over 7 Jul · inspected" },
];
