"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icons";
import { StockGroup } from "@/components/portal/stock/stock-group";
import type { Product, Provider } from "@/types/domain";

// Editable inventory tab: four KPIs, search + low-stock toggle, category
// chips, and the catalog grouped into per-category cards. Filtering/search
// state is local; all mutations (add/edit/delete/history) bubble up so
// StockView can own the shared modals.

interface InventoryKpi {
  label: string;
  value: string;
  sub: string;
  tone: string;
}

export function InventoryTab({
  products,
  providers,
  onOrderCount,
  onEdit,
  onHistory,
  onDelete,
}: {
  products: Product[];
  providers: Provider[];
  onOrderCount: number;
  onEdit: (product: Product) => void;
  onHistory: (id: string) => void;
  onDelete: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [lowOnly, setLowOnly] = useState(false);

  const providerNameFor = useMemo(() => {
    const byId = new Map(providers.map((p) => [p.id, p.name] as const));
    return (product: Product) => byId.get(product.prov) ?? "No provider";
  }, [providers]);

  // Categories present in the catalog, in first-seen order (chip list).
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (!seen.includes(p.cat)) seen.push(p.cat);
    return seen;
  }, [products]);

  const lowStockCount = products.filter((p) => p.qtyNow < p.par).length;
  const reorderCount = products.filter((p) => p.qtyNow < p.par * 0.5).length;

  const kpis: InventoryKpi[] = [
    { label: "Items tracked", value: String(products.length), sub: `Across ${categories.length} categories`, tone: "text-ink" },
    { label: "Low stock", value: String(lowStockCount), sub: "Below par level", tone: "text-amber" },
    { label: "Reorder now", value: String(reorderCount), sub: "Under half of par", tone: "text-rust" },
    { label: "On order", value: String(onOrderCount), sub: "Line items · placed orders", tone: "text-navy" },
  ];

  const q = query.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (catFilter !== "All" && p.cat !== catFilter) return false;
    if (lowOnly && !(p.qtyNow < p.par)) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || providerNameFor(p).toLowerCase().includes(q);
  });

  const groups = categories
    .map((cat) => ({ cat, items: filtered.filter((p) => p.cat === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="mt-[18px] grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-cream-2 px-5 py-[18px]">
            <div className="text-[13px] font-semibold text-ink-meta">{k.label}</div>
            <div className={cn("mt-[6px] font-serif text-[30px] leading-none", k.tone)}>{k.value}</div>
            <div className="mt-1 text-[12.5px] text-ink-faint">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-[10px] rounded-[11px] border border-line-soft bg-cream-2 px-[14px] py-[10px] transition-colors focus-within:border-navy">
          <Icon name="search" size={17} className="shrink-0 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or providers…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <button
          type="button"
          onClick={() => setLowOnly((v) => !v)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-4 py-[9px] text-[13px] font-semibold transition-colors",
            lowOnly
              ? "border-terracotta bg-terracotta-tint text-terracotta"
              : "border-line-soft bg-cream-2 text-ink-soft",
          )}
        >
          <span className="size-2 rounded-full bg-terracotta" />
          Low stock only
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCatFilter(c)}
            className={cn(
              "rounded-full px-[14px] py-[7px] text-[13px] font-semibold transition-colors",
              catFilter === c ? "bg-navy text-cream" : "border border-line-soft bg-cream-2 text-ink-soft",
            )}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-ink-faint">{filtered.length} items</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {groups.map((g) => (
          <StockGroup
            key={g.cat}
            category={g.cat}
            products={g.items}
            providerNameFor={providerNameFor}
            onHistory={(product) => onHistory(product.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-2xl border border-line bg-cream-2 px-5 py-10 text-center text-[14px] text-ink-faint">
          No items match your search.
        </div>
      )}
    </>
  );
}
