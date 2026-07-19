import Link from "next/link";
import { roomStatusMeta } from "@/lib/design-meta";
import { getRoomByNum } from "@/lib/mock-data/rooms";

// Resident-detail card summarising the resident's assigned room, linking to
// the full room screen. Room is still mock-data (no `rooms` table yet), so a
// resident's `room` may not resolve to a known room - render nothing then
// rather than a broken link.
export function RoomCard({ room: num }: { room: string }) {
  const room = getRoomByNum(num);
  if (!room) return null;
  const meta = roomStatusMeta[room.status];

  return (
    <Link
      href={`/portal/rooms/${room.num}`}
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
      <div className="mt-[2px] text-[13px] text-ink-faint">{room.careType} · Wesley</div>
      <div className="mt-[10px] text-[13px] text-ink-muted">Private room</div>
      <div className="mt-[14px] text-[13.5px] font-semibold text-bronze-text">View room details →</div>
    </Link>
  );
}
