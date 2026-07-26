import { createClient } from "@/lib/supabase/server";
import type { CareTier, RoomStatus } from "@/types/domain";

const BUILDING = "wesley";

/** Who currently occupies a room, resolved from `residents.room`. */
export interface RoomOccupant {
  slug: string;
  name: string;
  initials: string;
  color: string;
  diet: string;
  mobility: string;
}

/** A room in the real register (Supabase `rooms`). */
export interface RoomRecord {
  num: string;
  status: RoomStatus;
  /** "" until the home assigns this room a tier - it is no longer derived. */
  tier: CareTier | "";
  note: string;
  occupant: RoomOccupant | null;
}

// The building's real room register, each with whoever occupies it.
//
// Ordered by `sort_order` so "3A" follows "3" and the 125-134 block lands last;
// a text sort would put "10" before "2" and "125" before "25".
//
// Occupancy is derived from `residents.room` rather than stored on the room, so
// the two can never disagree - moving a resident is a single write.
export async function getRoomRecords(): Promise<RoomRecord[]> {
  const supabase = await createClient();
  const [roomsRes, residentsRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("num,status,tier,note")
      .eq("building_id", BUILDING)
      .order("sort_order"),
    supabase.from("residents").select("slug,name,room,avatar,color,diet,mobility"),
  ]);
  if (roomsRes.error || !roomsRes.data) return [];

  const byRoom = new Map<string, RoomOccupant>();
  for (const r of residentsRes.data ?? []) {
    if (!r.room) continue;
    byRoom.set(r.room, {
      slug: r.slug,
      name: r.name,
      initials: r.avatar ?? "",
      color: r.color ?? "#6E875E",
      diet: r.diet ?? "",
      mobility: r.mobility ?? "",
    });
  }

  return roomsRes.data.map((r) => {
    const occupant = byRoom.get(r.num) ?? null;
    return {
      num: r.num,
      // An occupied room reads Occupied whatever the column says - a resident
      // living in it is the stronger fact.
      status: (occupant ? "Occupied" : (r.status ?? "Available")) as RoomStatus,
      tier: (r.tier ?? "") as CareTier | "",
      note: r.note ?? "",
      occupant,
    };
  });
}

export async function getRoomByNumber(num: string): Promise<RoomRecord | null> {
  return (await getRoomRecords()).find((r) => r.num === num) ?? null;
}

/** Just the room numbers, for the resident form's "Location in facility" picker. */
export async function getRoomNumbers(): Promise<string[]> {
  return (await getRoomRecords()).map((r) => r.num);
}
