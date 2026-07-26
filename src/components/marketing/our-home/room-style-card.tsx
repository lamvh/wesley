import { Photo } from "@/components/shared/photo";
import type { SiteRoomStyleCard } from "@/lib/mock-data/site-content-defaults";

// Image card for one room style (Standard / Premium / VIP) on the our-home page.
// These were previously called "wing cards", but they never named a wing - the
// content has always been the home's room styles.
export function RoomStyleCard({ style }: { style: SiteRoomStyleCard }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="relative h-[150px]">
        <Photo
          slot={`roomstyle-${style.name}`}
          alt={`${style.name} room`}
          placeholder={`${style.name} room`}
        />
      </div>
      <div className="px-[22px] py-5">
        <div className="text-[11.5px] font-bold uppercase tracking-[1.2px] text-bronze">
          {style.care}
        </div>
        <h3 className="mt-1 font-serif text-[23px] font-semibold">{style.name}</h3>
        <p className="mt-2 text-[14px] leading-[1.6] text-ink-muted">{style.desc}</p>
      </div>
    </div>
  );
}
