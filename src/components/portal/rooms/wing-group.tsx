import { RoomCard } from "./room-card";
import type { Room } from "@/types/domain";

// A wing heading + responsive grid of its room cards.
export function WingGroup({
  name,
  count,
  items,
}: {
  name: string;
  count: number;
  items: Room[];
}) {
  return (
    <div className="mt-[6px]">
      <div className="mb-3 flex items-center gap-[10px]">
        <h3 className="font-serif text-[19px] font-semibold text-ink">{name}</h3>
        <span className="text-[12.5px] text-ink-faint">{count} rooms</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(238px,1fr))] gap-3">
        {items.map((room) => (
          <RoomCard key={room.num} room={room} />
        ))}
      </div>
    </div>
  );
}
