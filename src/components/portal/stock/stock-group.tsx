import { StockItemRow } from "@/components/portal/stock/stock-item-row";
import type { StockGroup as StockGroupData } from "@/types/domain";

// A supply category card: header strip (title + item count) over its rows.
export function StockGroup({ group }: { group: StockGroupData }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="flex items-center gap-[10px] border-b border-line-divider px-5 py-[15px]">
        <h3 className="flex-1 font-serif text-[19px] font-semibold text-ink">
          {group.category}
        </h3>
        <span className="text-[12.5px] text-ink-faint">{group.items.length} items</span>
      </div>
      <div>
        {group.items.map((item) => (
          <StockItemRow key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}
