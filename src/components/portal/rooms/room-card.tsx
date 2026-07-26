import Link from "next/link";
import { PersonBadge } from "@/components/shared/person-badge";
import { careTierMeta, roomStatusMeta } from "@/lib/design-meta";
import type { RoomRecord } from "@/lib/data/rooms";
import { cn } from "@/lib/utils";

// One room tile. Left status strip + status pill both come from the room-status
// scale so colour is never the sole signal. Occupied → a chip per resident (a
// room can hold a couple); otherwise the room note. The detail link carries the
// home because room numbers repeat across the two registers.
export function RoomCard({ room }: { room: RoomRecord }) {
  const meta = roomStatusMeta[room.status];
  const tier = room.tier ? careTierMeta[room.tier] : null;
  return (
    <Link
      href={`/portal/rooms/${room.num}?home=${room.buildingId}`}
      className="relative block overflow-hidden rounded-[14px] border border-line bg-cream-2 px-4 py-[15px] transition-all hover:border-line-strong hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.18)]"
    >
      {/* status left strip - dot bg class from the room-status scale */}
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-serif text-[20px] font-semibold text-ink">
            Room {room.num}
          </div>
          {/* Tier is optional data now, so the line is simply absent until set. */}
          {tier && (
            <span className={cn("mt-1 inline-block rounded-full px-[8px] py-[2px] text-[11px] font-semibold", tier.badge)}>
              {room.tier}
            </span>
          )}
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
      {room.occupants.length > 0 ? (
        <div className="mt-[13px] flex flex-col gap-[10px]">
          {room.occupants.map((occupant) => (
            <div key={occupant.slug} className="flex items-center gap-[10px]">
              <PersonBadge
                initials={occupant.initials}
                color={occupant.color}
                className="size-[34px] rounded-full text-[12px]"
              />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold text-ink">
                  {occupant.name}
                </div>
                <div className="text-[11.5px] text-ink-faint">
                  {occupant.diet || "No dietary note"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-[13px] text-[12.5px] leading-[1.4] text-ink-muted">
          {room.note || "Vacant"}
        </div>
      )}
    </Link>
  );
}
