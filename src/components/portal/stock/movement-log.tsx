import { cn } from "@/lib/utils";
import { Icon } from "@/components/shared/icons";
import type { Provider, StockMovement } from "@/types/domain";

// Global movement ledger (all products): date/actor, item, +/- pill, a
// details line (provider for IN, room/person + receiver for OUT), the
// resulting on-hand balance, and a delete/undo action. Private to the
// movements tab — StockView owns the shared delete-confirm modal.

const GRID = "grid-cols-[104px_1.4fr_78px_1.9fr_92px_44px]";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

/** Human line for the "Details" column: provider for IN, rooms/persons + receiver for OUT. */
function detailsFor(m: StockMovement, providerName: (id: string) => string): string {
  if (m.dir === "in") {
    return m.providerId ? providerName(m.providerId) : "No provider recorded";
  }
  const dests = m.dests ?? [];
  const parts = dests.map((d) => `${d.room ? `${d.room} · ` : ""}${d.person}${d.qty ? ` (${d.qty})` : ""}`);
  const base = parts.length > 0 ? parts.join(", ") : "Issued";
  return m.receiver ? `${base} → ${m.receiver}` : base;
}

export function MovementLog({
  movements,
  providers,
  onDelete,
}: {
  movements: StockMovement[];
  providers: Provider[];
  onDelete: (id: string) => void;
}) {
  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? "Unknown provider";

  return (
    <div className="wide-scroll overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="flex items-center justify-between border-b border-line-divider px-[22px] py-[15px]">
        <h3 className="font-serif text-[19px] font-semibold text-ink">Movement log</h3>
        <span className="text-[12.5px] text-ink-faint">{movements.length} entries</span>
      </div>

      <div className={cn("grid gap-3 border-b border-line-divider px-[22px] py-3 text-[11.5px] font-bold uppercase tracking-[.4px] text-ink-faint", GRID)}>
        <div>Date</div>
        <div>Item</div>
        <div>Move</div>
        <div>Details</div>
        <div className="text-right">On hand</div>
        <div />
      </div>

      {movements.map((m) => (
        <div key={m.id} className={cn("grid items-center gap-3 border-b border-line-divider px-[22px] py-[13px]", GRID)}>
          <div className="text-[12.5px] text-ink-muted">
            {formatDate(m.date)}
            <div className="mt-[2px] text-[11px] text-ink-faint">{m.by}</div>
          </div>
          <div className="min-w-0 text-[13.5px] font-semibold text-ink">{m.item}</div>
          <div>
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-[9px] py-1 text-[11.5px] font-bold",
                m.dir === "in" ? "bg-sage-tint text-sage" : "bg-rust-tint text-rust",
              )}
            >
              {m.dir === "in" ? "+" : "−"}{m.qty} {m.unit}
            </span>
          </div>
          <div className="min-w-0 text-[12.5px] text-ink-soft">
            {detailsFor(m, providerName)}
            {m.note && <div className="mt-[2px] text-[11.5px] text-ink-faint">{m.note}</div>}
          </div>
          <div className="text-right text-[13.5px] font-semibold text-ink">
            {m.afterQty} {m.unit}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onDelete(m.id)}
              title="Undo / remove"
              className="flex size-8 items-center justify-center rounded-[9px] border border-rust/25 bg-rust-tint text-rust"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
      ))}

      {movements.length === 0 && (
        <div className="px-5 py-[34px] text-center text-[13.5px] text-ink-faint">
          No movements yet. Record a stock in or stock out to start the log.
        </div>
      )}
    </div>
  );
}
