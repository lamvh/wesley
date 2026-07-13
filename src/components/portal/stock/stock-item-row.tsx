import { cn } from "@/lib/utils";
import { stockLevel } from "@/lib/design-meta";
import type { SupplyItem } from "@/types/domain";

// One supply line: status dot, name + par, level bar, quantity, status pill.
// Dot / bar-fill / pill colour all derive from qty vs par (stockLevel helper).
export function StockItemRow({ item }: { item: SupplyItem }) {
  const { status, pct, swatch } = stockLevel(item.qty, item.par);

  return (
    <div className="flex items-center gap-[18px] border-b border-line-divider px-5 py-[13px]">
      <span className={cn("size-[9px] shrink-0 rounded-full", swatch.dot)} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-ink">{item.name}</div>
        <div className="text-[12.5px] text-ink-faint">
          Par level {item.par} {item.unit}
        </div>
      </div>
      <div className="w-[180px]">
        <div className="h-[7px] overflow-hidden rounded-full bg-line-soft">
          <div
            className={cn("h-full rounded-full", swatch.dot)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-24 text-right text-[14px] font-semibold text-ink-soft">
        {item.qty} {item.unit}
      </div>
      <div className="w-24 text-right">
        <span
          className={cn(
            "rounded-full px-[11px] py-[5px] text-[12px] font-semibold",
            swatch.badge,
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
