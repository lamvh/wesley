import { cn } from "@/lib/utils";
import { QtyStepper } from "@/components/portal/stock/qty-stepper";

// Presentational order tab: catalog rows with steppers (left) and a sticky
// order-draft sidebar (right) that groups the cart into per-provider POs.

export interface OrderRow {
  id: string;
  name: string;
  unit: string;
  provName: string;
  priceLabel: string;
  stockLabel: string;
  stockColor: string;
  qty: number;
}

export interface OrderCategory {
  cat: string;
  items: OrderRow[];
}

export interface CartLine {
  id: string;
  qty: number;
  name: string;
  lineLabel: string;
}

export interface CartGroup {
  prov: string;
  provName: string;
  subtotalLabel: string;
  lines: CartLine[];
}

export function OrderTab({
  orderCats,
  cartGroups,
  cartCount,
  poCount,
  cartTotalLabel,
  cartEmpty,
  orderPlaced,
  orderError,
  onBump,
  onPlace,
  onClear,
}: {
  orderCats: OrderCategory[];
  cartGroups: CartGroup[];
  cartCount: number;
  poCount: number;
  cartTotalLabel: string;
  cartEmpty: boolean;
  orderPlaced: boolean;
  orderError?: string | null;
  onBump: (id: string, delta: number) => void;
  onPlace: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-[18px] grid grid-cols-[1fr_340px] items-start gap-[18px] max-lg:grid-cols-1">
      {/* Catalog, grouped by category */}
      <div className="flex flex-col gap-4">
        {orderCats.map((g) => (
          <section key={g.cat} className="overflow-hidden rounded-2xl border border-line bg-cream-2">
            <div className="border-b border-line-divider px-5 py-[14px]">
              <h3 className="font-serif text-[18px] font-semibold text-ink">{g.cat}</h3>
            </div>
            {g.items.map((it) => (
              <div
                key={it.id}
                className={cn(
                  "grid grid-cols-[1.8fr_.9fr_.8fr_.9fr_118px] items-center gap-[14px] border-b border-line-divider px-5 py-3 max-sm:grid-cols-2",
                  it.qty > 0 && "bg-cream",
                )}
              >
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold text-ink">{it.name}</div>
                  <div className="text-[12px] text-ink-faint">
                    {it.unit} · {it.provName}
                  </div>
                </div>
                <div className="text-[13.5px] text-ink-nav">{it.priceLabel}</div>
                <div className={cn("text-[13px] font-semibold", it.stockColor)}>{it.stockLabel}</div>
                <div className="text-[12px] text-ink-faint max-sm:hidden">on hand / par</div>
                <QtyStepper
                  qty={it.qty}
                  onInc={() => onBump(it.id, 1)}
                  onDec={() => onBump(it.id, -1)}
                />
              </div>
            ))}
          </section>
        ))}
      </div>

      {/* Order draft */}
      <aside className="sticky top-[88px] overflow-hidden rounded-2xl border border-line bg-cream-2">
        <div className="border-b border-line-divider bg-navy-deep px-[18px] py-4">
          <div className="font-serif text-[19px] font-semibold text-cream">Order draft</div>
          <div className="mt-[2px] text-[12.5px] text-sidebar-idle">
            {cartCount} items · {poCount} purchase order(s)
          </div>
        </div>

        {cartEmpty && !orderPlaced && (
          <div className="px-5 py-[34px] text-center text-[13.5px] leading-[1.55] text-ink-faint">
            No items yet.
            <br />
            Add products, or tap
            <br />
            <b className="text-navy">Auto-fill reorder</b> to top up.
          </div>
        )}

        {orderPlaced && (
          <div className="px-5 py-[26px] text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-sage-tint text-[22px] text-sage">
              ✓
            </div>
            <div className="mt-3 text-[14.5px] font-semibold text-ink">Order sent</div>
            <div className="mt-1 text-[13px] text-ink-faint">
              Purchase orders recorded for each provider.
            </div>
          </div>
        )}

        {!cartEmpty &&
          cartGroups.map((cg) => (
            <div key={cg.prov} className="border-b border-line-divider px-[18px] py-[13px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[.4px] text-ink-meta">
                  {cg.provName}
                </span>
                <span className="text-[12.5px] font-semibold text-ink-soft">{cg.subtotalLabel}</span>
              </div>
              {cg.lines.map((ln) => (
                <div key={ln.id} className="flex items-center justify-between gap-[10px] py-[3px]">
                  <span className="min-w-0 text-[13px] text-ink-nav">
                    {ln.qty} × {ln.name}
                  </span>
                  <span className="shrink-0 text-[12.5px] text-ink-faint">{ln.lineLabel}</span>
                </div>
              ))}
            </div>
          ))}

        <div className="px-[18px] py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-ink-soft">Total (excl. GST)</span>
            <span className="font-serif text-[22px] text-ink">{cartTotalLabel}</span>
          </div>
          {orderError && <p className="text-rust text-[13px] mt-2">{orderError}</p>}
          <button
            type="button"
            onClick={onPlace}
            className="w-full rounded-[11px] bg-navy py-[13px] text-[14.5px] font-semibold text-cream"
          >
            Place order
          </button>
          <button
            type="button"
            onClick={onClear}
            className="w-full pt-[10px] pb-[2px] text-[13px] font-semibold text-rust"
          >
            Clear draft
          </button>
        </div>
      </aside>
    </div>
  );
}
