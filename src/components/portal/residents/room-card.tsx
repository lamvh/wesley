import Link from "next/link";
import { careTierMeta, roomStatusMeta } from "@/lib/design-meta";
import { getRoomByNumber } from "@/lib/data/rooms";
import { cn } from "@/lib/utils";

// Resident-detail card summarising the resident's assigned room, linking to the
// full room screen. Reads the real register; a resident with no room, or one
// that isn't in the register, renders nothing rather than a broken link.
//
// Looked up by (home, number): both registers have a 3A, so the number alone
// would point a Lodge resident at Wesley's room.
export async function RoomCard({ room: num, buildingId }: { room: string; buildingId: string }) {
  if (!num) return null;
  const room = await getRoomByNumber(num, buildingId);
  if (!room) return null;

  const meta = roomStatusMeta[room.status];
  const tier = room.tier ? careTierMeta[room.tier] : null;

  return (
    <Link
      href={`/portal/rooms/${room.num}?home=${room.buildingId}`}
      className="block rounded-xl border border-line-soft border-l-[5px] bg-cream p-[18px] transition-colors hover:border-line-strong hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.18)]"
      style={{ borderLeftColor: `var(--color-${meta.dot.replace("bg-", "")})` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold uppercase tracking-[0.3px] text-navy">Room</div>
        <span className={`rounded-full px-[10px] py-[4px] text-[11.5px] font-semibold ${meta.badge}`}>
          {room.status}
        </span>
      </div>
      <div className="mt-[9px] font-serif text-[24px] font-semibold text-ink">Room {room.num}</div>
      {tier && (
        <span className={cn("mt-[6px] inline-block rounded-full px-[9px] py-[2px] text-[11.5px] font-semibold", tier.badge)}>
          {room.tier}
        </span>
      )}
      <div className="mt-[14px] text-[13.5px] font-semibold text-bronze-text">View room details →</div>
    </Link>
  );
}
