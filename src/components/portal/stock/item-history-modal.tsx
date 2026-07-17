"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getItemHistory } from "@/lib/actions/stock";
import type { Product, StockMovement } from "@/types/domain";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

/** Human line for the "Details" column: received/provider note, or where issued stock went. */
function detailsFor(m: StockMovement): string {
  if (m.dir === "in") {
    return m.unitPrice ? `Received · $${m.unitPrice.toFixed(2)}/unit` : "Received";
  }
  if (m.dests && m.dests.length > 0) {
    return m.dests
      .map((d) => `${d.room ? `${d.room} · ` : ""}${d.person} (${d.qty})`)
      .join(", ");
  }
  return m.receiver ? `Issued to ${m.receiver}` : "Issued";
}

// In/out history for one product. Fetches its own data client-side via the
// getItemHistory server action once mounted. The caller keys this component
// on the product id, so switching items remounts it - `moves` naturally
// starts empty again instead of needing a setState-based reset in an effect.
export function ItemHistoryModal({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const [moves, setMoves] = useState<StockMovement[]>([]);

  useEffect(() => {
    if (!open || !product) return;
    let cancelled = false;
    getItemHistory(product.id).then((data) => {
      if (!cancelled) setMoves(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, product]);

  if (!open || !product) return null;

  const totalIn = moves.filter((m) => m.dir === "in").reduce((a, m) => a + m.qty, 0);
  const totalOut = moves.filter((m) => m.dir === "out").reduce((a, m) => a + m.qty, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[205] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-[680px] max-w-full flex-col rounded-[18px] border border-line-soft bg-cream"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold text-ink">{product.name}</h3>
            <p className="mt-[5px] text-[13px] text-ink-muted">In/out history</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[26px] leading-none text-ink-faint"
          >
            ×
          </button>
        </div>

        <div className="flex gap-3 border-b border-line-divider px-[26px] py-4">
          <div className="flex-1 rounded-xl bg-sage-tint px-4 py-3">
            <div className="text-[12px] font-semibold text-sage">Total received</div>
            <div className="mt-[3px] font-serif text-[24px] leading-none text-sage">+{totalIn}</div>
          </div>
          <div className="flex-1 rounded-xl bg-rust-tint px-4 py-3">
            <div className="text-[12px] font-semibold text-rust">Total issued</div>
            <div className="mt-[3px] font-serif text-[24px] leading-none text-rust">−{totalOut}</div>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="grid grid-cols-[118px_78px_1fr_92px] gap-3 border-b border-line-divider px-[26px] py-3 text-[11.5px] font-bold uppercase tracking-[.4px] text-ink-faint">
            <div>Date</div>
            <div>Move</div>
            <div>Details</div>
            <div className="text-right">On hand</div>
          </div>

          {moves.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[118px_78px_1fr_92px] items-center gap-3 border-b border-line-divider px-[26px] py-[13px]"
            >
              <div className="text-[12.5px] text-ink-muted">
                {formatDate(m.date)}
                <div className="mt-[2px] text-[11px] text-ink-faint">{m.by}</div>
              </div>
              <div>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-[9px] py-1 text-[11.5px] font-bold",
                    m.dir === "in" ? "bg-sage-tint text-sage" : "bg-rust-tint text-rust",
                  )}
                >
                  {m.dir === "in" ? "+" : "−"}{m.qty}
                </span>
              </div>
              <div className="min-w-0 text-[12.5px] text-ink-soft">
                {detailsFor(m)}
                {m.note && <div className="mt-[2px] text-[11.5px] text-ink-faint">{m.note}</div>}
              </div>
              <div className="text-right text-[13.5px] font-semibold text-ink">
                {m.afterQty} {m.unit}
              </div>
            </div>
          ))}

          {moves.length === 0 && (
            <div className="px-5 py-[38px] text-center text-[13.5px] text-ink-faint">
              No stock in or out recorded for this item yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
