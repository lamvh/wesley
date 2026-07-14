import { StockItemRow } from "@/components/portal/stock/stock-item-row";
import type { Product } from "@/types/domain";

// A supply category card: header strip (title + item count) over its rows.
// Private to the inventory tab — providerName/actions are resolved by the
// caller so this component stays a thin presentational wrapper.
export function StockGroup({
  category,
  products,
  providerNameFor,
  onHistory,
  onEdit,
  onDelete,
}: {
  category: string;
  products: Product[];
  providerNameFor: (product: Product) => string;
  onHistory: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="flex items-center gap-[10px] border-b border-line-divider px-5 py-[15px]">
        <h3 className="flex-1 font-serif text-[19px] font-semibold text-ink">{category}</h3>
        <span className="text-[12.5px] text-ink-faint">{products.length} items</span>
      </div>
      <div>
        {products.map((product) => (
          <StockItemRow
            key={product.id}
            product={product}
            providerName={providerNameFor(product)}
            onHistory={() => onHistory(product)}
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete(product)}
          />
        ))}
      </div>
    </section>
  );
}
