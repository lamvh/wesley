import { cn } from "@/lib/utils";
import { stockLevel } from "@/lib/design-meta";
import { Icon } from "@/components/shared/icons";
import type { Product } from "@/types/domain";

// One inventory line: status dot / name + par+provider+price / level bar /
// qty / status pill / history-edit-delete actions. Dot/bar/pill colour all
// derive from qty vs par (stockLevel helper). Private to the inventory tab.
export function StockItemRow({
  product,
  providerName,
  onHistory,
  onEdit,
  onDelete,
}: {
  product: Product;
  providerName: string;
  onHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { status, pct, swatch } = stockLevel(product.qtyNow, product.par);

  return (
    <div className="flex items-center gap-4 border-b border-line-divider px-5 py-[13px]">
      <span className={cn("size-[9px] shrink-0 rounded-full", swatch.dot)} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-ink">{product.name}</div>
        <div className="text-[12.5px] text-ink-faint">
          Par {product.par} {product.unit} · {providerName} · ${product.price.toFixed(2)}
        </div>
      </div>
      <div className="w-[140px] max-sm:hidden">
        <div className="h-[7px] overflow-hidden rounded-full bg-line-soft">
          <div className={cn("h-full rounded-full", swatch.dot)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="w-[88px] shrink-0 text-right text-[14px] font-semibold text-ink-soft">
        {product.qtyNow} {product.unit}
      </div>
      <div className="w-[86px] shrink-0 text-right">
        <span className={cn("rounded-full px-[11px] py-[5px] text-[12px] font-semibold", swatch.badge)}>
          {status}
        </span>
      </div>
      <div className="flex shrink-0 gap-[6px]">
        <button
          type="button"
          onClick={onHistory}
          title="In/out history"
          className="flex size-8 items-center justify-center rounded-[9px] border border-line-soft bg-cream-2 text-ink-muted"
        >
          <Icon name="history" size={16} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Edit"
          className="flex size-8 items-center justify-center rounded-[9px] border border-line-soft bg-cream-2 text-navy"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Remove"
          className="flex size-8 items-center justify-center rounded-[9px] border border-rust/25 bg-rust-tint text-rust"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}
