import { cn } from "@/lib/utils";
import type { MealService } from "@/types/domain";

// Per-meal header wash + eyebrow colour (breakfast amber, lunch sage/navy,
// dinner terracotta families). Presentation only — keyed off the service name.
const headStyle: Record<
  MealService["meal"],
  { head: string; eyebrow: string }
> = {
  Breakfast: { head: "bg-amber-tint/50", eyebrow: "text-amber" },
  Lunch: { head: "bg-sage-tint/60", eyebrow: "text-navy" },
  Dinner: { head: "bg-terracotta-tint/40", eyebrow: "text-terracotta" },
};

// One meal service: tinted header (eyebrow + time) over item + note rows.
export function MealCard({ meal }: { meal: MealService }) {
  const style = headStyle[meal.meal];

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-cream-2">
      <div className={cn("border-b border-line-divider px-5 py-[15px]", style.head)}>
        <div
          className={cn(
            "text-[12px] font-bold uppercase tracking-[1px]",
            style.eyebrow,
          )}
        >
          {meal.meal}
        </div>
        <div className="mt-[2px] text-[13px] text-ink-meta">{meal.time}</div>
      </div>
      <div className="px-5 pb-[14px] pt-2">
        {meal.items.map((item) => (
          <div key={item.name} className="border-b border-line-divider py-[11px]">
            <div className="text-[14.5px] font-semibold text-ink">
              {item.name}
            </div>
            <div className="text-[12.5px] text-ink-faint">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
