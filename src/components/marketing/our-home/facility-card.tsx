import type { Facility } from "@/types/domain";

// Single facility tile in the our-home facilities grid.
export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <div className="rounded-2xl border border-line bg-cream p-[22px]">
      <h3 className="font-serif text-[18px] font-semibold">{facility.title}</h3>
      <p className="mt-[7px] text-[14px] leading-[1.55] text-ink-muted">
        {facility.desc}
      </p>
    </div>
  );
}
