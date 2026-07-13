import { cn } from "@/lib/utils";
import { StockGroup } from "@/components/portal/stock/stock-group";
import type { Product, StockGroup as StockGroupData } from "@/types/domain";

// Inventory tab: four summary KPIs over the catalog grouped into category cards.
// Each item's dot / bar / status pill derive from qty-vs-par inside StockItemRow.

interface InventoryKpi {
  label: string;
  value: string;
  sub: string;
  tone: string;
}

/** Group the flat catalog into category cards, mapping products to supply rows. */
function groupCatalog(catalog: Product[]): StockGroupData[] {
  const groups: StockGroupData[] = [];
  for (const p of catalog) {
    let g = groups.find((x) => x.category === p.cat);
    if (!g) {
      g = { category: p.cat, items: [] };
      groups.push(g);
    }
    g.items.push({ name: p.name, qty: p.qtyNow, par: p.par, unit: p.unit });
  }
  return groups;
}

export function InventoryTab({
  catalog,
  cartCount,
  poCount,
  cartTotalLabel,
}: {
  catalog: Product[];
  cartCount: number;
  poCount: number;
  cartTotalLabel: string;
}) {
  const groups = groupCatalog(catalog);
  const belowPar = catalog.filter((p) => p.qtyNow < p.par).length;

  const kpis: InventoryKpi[] = [
    { label: "Items tracked", value: String(catalog.length), sub: `Across ${groups.length} categories`, tone: "text-ink" },
    { label: "Below par", value: String(belowPar), sub: "Need topping up", tone: "text-amber" },
    { label: "In cart", value: String(cartCount), sub: `${poCount} provider order(s)`, tone: "text-navy" },
    { label: "Cart total", value: cartTotalLabel, sub: "Excl. GST", tone: "text-sage" },
  ];

  return (
    <>
      <div className="mt-[18px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-cream-2 px-5 py-[18px]">
            <div className="text-[13px] font-semibold text-ink-meta">{k.label}</div>
            <div className={cn("mt-[6px] font-serif text-[30px] leading-none", k.tone)}>
              {k.value}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-faint">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((g) => (
          <StockGroup key={g.category} group={g} />
        ))}
      </div>
    </>
  );
}
