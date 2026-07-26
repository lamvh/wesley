import type { RoomRecord } from "@/lib/data/rooms";
import type { SearchOption } from "@/components/portal/stock/search-select";

// Turns the room register into the option list behind the "Issue to rooms"
// picker. Shared by the server page (which builds it) and the client rows
// (which read the structured fields back off the chosen option).

/** The home whose stock the screen manages. Rooms elsewhere are still
 *  offerable - both homes draw on this store - but they get labelled, because
 *  a bare "3A" exists in each register. */
export const STOCK_HOME_ID = "wesley";

export interface RoomDestOption extends SearchOption {
  /** Room number as it appears in the register. */
  room: string;
  /** Occupant name, or "" for a room with nobody in it. */
  person: string;
  /** Building name, set ONLY for homes other than the stock home, and carried
   *  into the ledger so a borrowed "3A" never reads as a Wesley 3A. Undefined
   *  therefore means "this store's own home" - the same rule the picker's
   *  hint follows, so what is shown and what is stored cannot drift. */
  home?: string;
}

/** One option per occupant, plus one per empty room so stock can still be
 *  issued to a room that is between residents.
 *
 * The value is keyed on (building, room, occupant) because room numbers repeat
 * across the homes and The Lodge's 10B holds two people - room number alone
 * would collide on both counts.
 */
export function buildRoomDestOptions(
  rooms: RoomRecord[],
  homeNameById: Record<string, string>,
): RoomDestOption[] {
  const options: RoomDestOption[] = [];

  for (const room of rooms) {
    const name = homeNameById[room.buildingId] ?? room.buildingId;
    // Only the other home is named. Labelling every Wesley row would bury the
    // room number under a fact true of almost every row - and the label and
    // the stored `home` follow the same rule, so display and ledger agree.
    const home = room.buildingId === STOCK_HOME_ID ? undefined : name;

    if (room.occupants.length === 0) {
      options.push({
        value: `${room.buildingId}::${room.num}::`,
        label: `Room ${room.num} · vacant`,
        hint: home,
        keywords: `${room.num} ${name} empty`,
        room: room.num,
        person: "",
        home,
      });
      continue;
    }
    for (const occupant of room.occupants) {
      options.push({
        value: `${room.buildingId}::${room.num}::${occupant.slug}`,
        label: `Room ${room.num} · ${occupant.name}`,
        hint: home,
        keywords: `${room.num} ${occupant.name} ${name}`,
        room: room.num,
        person: occupant.name,
        home,
      });
    }
  }

  return options;
}
