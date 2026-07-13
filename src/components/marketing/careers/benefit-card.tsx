import type { Benefit } from "@/types/domain";

// Single benefit tile in the careers benefits grid.
export function BenefitCard({ benefit }: { benefit: Benefit }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[26px]">
      <h3 className="font-serif text-[21px] font-semibold">{benefit.title}</h3>
      <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-muted">
        {benefit.desc}
      </p>
    </div>
  );
}
