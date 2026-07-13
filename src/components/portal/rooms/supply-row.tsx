import { stockLevel } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { SupplyItem } from "@/types/domain";

// One supply line: status dot + name/par + qty + stock-level pill. Colour
// (dot + pill) is derived from qty/par via the stock/alert scale.
export function SupplyRow({ item }: { item: SupplyItem }) {
  const stock = stockLevel(item.qty, item.par);
  return (
    <div className="flex items-center gap-3 border-b border-line-divider py-[11px]">
      <span className={cn("size-2 shrink-0 rounded-full", stock.swatch.dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-ink">{item.name}</div>
        <div className="text-[11.5px] text-ink-faint">
          Par {item.par} {item.unit}
        </div>
      </div>
      <div className="text-[13px] font-semibold text-ink-soft">{item.qty}</div>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-[9px] py-1 text-[11px] font-semibold",
          stock.swatch.badge,
        )}
      >
        {stock.status}
      </span>
    </div>
  );
}
