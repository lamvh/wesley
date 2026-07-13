import type { Kpi, Room, Wing } from "@/types/domain";
import { actsByWing, roomSeed, roomSupplies } from "./rooms-data";

const rooms: Room[] = roomSeed.map((r) => {
  const occupied = !!r.resident;
  return {
    num: r.num,
    wing: r.wing,
    status: r.status,
    careType: r.careType,
    resident: r.resident,
    note: r.note,
    house: r.house,
    supplies: occupied ? roomSupplies : [],
    activities: occupied ? actsByWing[r.wing] : [],
  };
});

export function getRooms(): Room[] {
  return rooms;
}

export function getRoomByNum(num: string): Room | undefined {
  return rooms.find((r) => r.num === num);
}

export function getRoomKpis(): Kpi[] {
  return [
    { label: "Occupied", value: "50", sub: "of 54 suites", valueTone: "ink" },
    { label: "Available now", value: "2", sub: "Ready for admission", valueTone: "available" },
    { label: "VIP suites", value: "12", sub: "Tōtara · fully booked", valueTone: "gold" },
    { label: "Maintenance", value: "1", sub: "Rātā 03 · rail repair", valueTone: "rust" },
  ];
}

const wingLabels: Record<Wing, string> = {
  Rātā: "Rātā · Normal",
  Kōwhai: "Kōwhai · Premium",
  Tōtara: "Tōtara · VIP",
};

export function getRoomWings(): { name: string; count: number; items: Room[] }[] {
  const order: Wing[] = ["Rātā", "Kōwhai", "Tōtara"];
  return order.map((wing) => {
    const items = rooms.filter((r) => r.wing === wing);
    return { name: wingLabels[wing], count: items.length, items };
  });
}
