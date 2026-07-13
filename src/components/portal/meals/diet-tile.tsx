import type { DietCount } from "@/types/domain";

// One dietary-requirement count tile: big serif number over its label.
export function DietTile({ diet }: { diet: DietCount }) {
  return (
    <div className="rounded-[12px] border border-line-soft bg-cream p-4 text-center">
      <div className="font-serif text-[30px] text-navy">{diet.count}</div>
      <div className="mt-[3px] text-[13px] font-semibold text-ink-soft">
        {diet.label}
      </div>
    </div>
  );
}
