import type { Provider } from "@/types/domain";

/** First letters of the first two words, e.g. "CareWell Continence" -> "CC". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Providers tab: two-column grid of supplier cards. Avatar + badge colours are
// per-provider data (sanctioned inline style). "New order" jumps to the order tab.
export function ProvidersTab({
  providers,
  onNewOrder,
}: {
  providers: Provider[];
  onNewOrder: () => void;
}) {
  return (
    <div className="mt-[18px] grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      {providers.map((p) => (
        <div key={p.id} className="rounded-2xl border border-line bg-cream-2 px-[22px] py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl font-serif text-[20px] font-semibold"
                style={{ background: p.tint, color: p.color }}
              >
                {initialsOf(p.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-ink">{p.name}</div>
                <div className="text-[12.5px] text-ink-faint">{p.cat}</div>
              </div>
            </div>
            <span
              className="whitespace-nowrap rounded-full px-[10px] py-1 text-[11.5px] font-bold"
              style={{ background: p.tint, color: p.color }}
            >
              {p.pref ? "Preferred" : "Approved"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-[10px]">
            <Field label="Lead time" value={p.lead} />
            <Field label="Terms" value={p.terms} />
            <Field label="Email" value={p.contact} valueClass="text-navy" />
            <Field label="Phone" value={p.phone} />
          </div>

          <button
            type="button"
            onClick={onNewOrder}
            className="mt-4 rounded-[10px] bg-navy-tint px-[15px] py-[9px] text-[13px] font-semibold text-navy"
          >
            New order from {p.name}
          </button>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  valueClass = "text-ink-soft",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[.4px] text-ink-faint">{label}</div>
      <div className={`mt-[2px] text-[13.5px] ${valueClass}`}>{value}</div>
    </div>
  );
}
