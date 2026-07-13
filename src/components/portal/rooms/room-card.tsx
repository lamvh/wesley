import Link from "next/link";
import { PersonBadge } from "@/components/shared/person-badge";
import { careTier, roomStatusMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { Room } from "@/types/domain";

// One room tile in a wing group. Left status strip + status pill both come
// from the room-status scale so colour is never the sole signal. Occupied →
// resident chip; otherwise a note line. Navigates to the room detail route.
export function RoomCard({ room }: { room: Room }) {
  const meta = roomStatusMeta[room.status];
  return (
    <Link
      href={`/portal/rooms/${room.num}`}
      className="relative block overflow-hidden rounded-[14px] border border-line bg-cream-2 px-4 py-[15px] transition-all hover:border-line-strong hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.18)]"
    >
      {/* status left strip — dot bg class from the room-status scale */}
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-serif text-[20px] font-semibold text-ink">
            Room {room.num}
          </div>
          <div className="text-[11.5px] text-ink-faint">{careTier(room.wing)}</div>
        </div>
        <span
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-[9px] py-1 text-[11px] font-semibold",
            meta.badge,
          )}
        >
          {room.status}
        </span>
      </div>
      {room.resident ? (
        <div className="mt-[13px] flex items-center gap-[10px]">
          <PersonBadge
            initials={room.resident.initials}
            color={room.resident.color}
            className="size-[34px] rounded-full text-[12px]"
          />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-ink">
              {room.resident.name}
            </div>
            <div className="text-[11.5px] text-ink-faint">{room.resident.diet}</div>
          </div>
        </div>
      ) : (
        <div className="mt-[13px] text-[12.5px] leading-[1.4] text-ink-muted">
          {room.note}
        </div>
      )}
    </Link>
  );
}
