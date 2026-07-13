import { Photo } from "@/components/shared/photo";
import type { CareWing } from "@/types/domain";

// Image card for one care wing (Rātā / Kōwhai / Tōtara) on the our-home page.
export function WingCard({ wing }: { wing: CareWing }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="relative h-[150px]">
        <Photo
          slot={`wing-${wing.name}`}
          alt={`${wing.name} wing`}
          placeholder={`${wing.name} wing`}
        />
      </div>
      <div className="px-[22px] py-5">
        <div className="text-[11.5px] font-bold uppercase tracking-[1.2px] text-bronze">
          {wing.care}
        </div>
        <h3 className="mt-1 font-serif text-[23px] font-semibold">{wing.name}</h3>
        <p className="mt-2 text-[14px] leading-[1.6] text-ink-muted">{wing.desc}</p>
      </div>
    </div>
  );
}
