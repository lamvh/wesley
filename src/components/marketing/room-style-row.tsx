import Link from "next/link";
import { Photo } from "@/components/shared/photo";
import { Button } from "@/components/ui/button";
import type { RoomStyle } from "@/types/domain";

// Large 2-col marketing row for one room style: photo left, detail panel right.
// Distinct from the portal occupancy room-card — this is a feature presentation.
export function RoomStyleRow({ style }: { style: RoomStyle }) {
  return (
    <div className="grid grid-cols-[0.9fr_1.1fr] items-stretch overflow-hidden rounded-[20px] border border-line bg-cream-2 max-md:grid-cols-1">
      <div className="relative min-h-[300px]">
        <Photo slot={`care-${style.slot}`} alt={style.name} placeholder={style.name} />
      </div>
      <div className="px-10 py-[34px]">
        <div className="text-[11.5px] font-bold uppercase tracking-[1.4px] text-bronze">
          {style.wing}
        </div>
        <h2 className="mt-1.5 font-serif text-[30px] font-semibold">{style.name}</h2>
        <p className="mt-3 mb-[18px] text-[15.5px] leading-[1.62] text-ink-muted">
          {style.desc}
        </p>
        <div className="flex flex-col gap-2.5">
          {style.points.map((point) => (
            <div
              key={point}
              className="flex items-center gap-[11px] text-[14.5px] text-ink-soft"
            >
              <span className="shrink-0 font-bold text-navy">✓</span>
              {point}
            </div>
          ))}
        </div>
        <Button
          asChild
          className="mt-[22px] h-auto rounded-[11px] bg-navy px-5 py-3 text-[14.5px] font-semibold text-cream hover:bg-navy/90"
        >
          <Link href="/contact">Enquire about {style.name}</Link>
        </Button>
      </div>
    </div>
  );
}
