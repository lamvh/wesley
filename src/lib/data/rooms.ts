import { createClient } from "@/lib/supabase/server";
import type { CareTier, RoomStatus } from "@/types/domain";

/** The home the admit form places new residents in. */
export const DEFAULT_BUILDING = "wesley";

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
  /** `buildings.id` - room numbers repeat across homes, so this is part of the
   *  room's identity, not decoration. */
  buildingId: string;
  num: string;
  status: RoomStatus;
  /** "" until the home assigns this room a tier - it is no longer derived. */
  tier: CareTier | "";
  note: string;
  /** Usually one person; The Lodge's 10B holds a couple, so this is a list. */
  occupants: RoomOccupant[];
}

/** Room register for both homes, each room with whoever occupies it.
 *
 * Within a home, ordered by `sort_order` so "3A" follows "3" and the 125-134
 * block lands last; a text sort would put "10" before "2" and "125" before "25".
 *
 * Occupancy is derived from `residents.room` rather than stored on the room, so
 * the two can never disagree - moving a resident is a single write. The join key
 * is (building, room): both homes have a 3A, so matching on the number alone
 * would show one home's resident in the other's room.
 */
export async function getRoomRecords(): Promise<RoomRecord[]> {
  const supabase = await createClient();
  const [roomsRes, residentsRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("building_id,num,status,tier,note")
      .order("sort_order"),
    supabase.from("residents").select("slug,building_id,name,room,avatar,color,diet,mobility"),
  ]);
  if (roomsRes.error || !roomsRes.data) return [];

  const key = (buildingId: string, num: string) => `${buildingId}::${num}`;
  const byRoom = new Map<string, RoomOccupant[]>();
  for (const r of residentsRes.data ?? []) {
    if (!r.room) continue;
    const k = key(r.building_id, r.room);
    const list = byRoom.get(k) ?? [];
    list.push({
      slug: r.slug,
      name: r.name,
      initials: r.avatar ?? "",
      color: r.color ?? "#6E875E",
      diet: r.diet ?? "",
      mobility: r.mobility ?? "",
    });
    byRoom.set(k, list);
  }

  return roomsRes.data.map((r) => {
    const occupants = byRoom.get(key(r.building_id, r.num)) ?? [];
    return {
      buildingId: r.building_id,
      num: r.num,
      // An occupied room reads Occupied whatever the column says - a resident
      // living in it is the stronger fact.
      status: (occupants.length ? "Occupied" : (r.status ?? "Available")) as RoomStatus,
      tier: (r.tier ?? "") as CareTier | "",
      note: r.note ?? "",
      occupants,
    };
  });
}

/** One room, identified by its home and number - "3A" alone is ambiguous. */
export async function getRoomByNumber(
  num: string,
  buildingId: string = DEFAULT_BUILDING,
): Promise<RoomRecord | null> {
  const rooms = await getRoomRecords();
  return rooms.find((r) => r.num === num && r.buildingId === buildingId) ?? null;
}

/** Room numbers of one home, for the resident form's "Location in facility"
 *  picker. Scoped so a Wesley admission can't be filed into a Lodge room. */
export async function getRoomNumbers(buildingId: string = DEFAULT_BUILDING): Promise<string[]> {
  return (await getRoomRecords()).filter((r) => r.buildingId === buildingId).map((r) => r.num);
}

/** Room numbers of every home, keyed by `buildings.id`, for the resident form:
 *  picking a home has to swap the room list, and both come from one query. */
export async function getRoomNumbersByBuilding(): Promise<Record<string, string[]>> {
  const grouped: Record<string, string[]> = {};
  for (const room of await getRoomRecords()) {
    (grouped[room.buildingId] ??= []).push(room.num);
  }
  return grouped;
}
