import { Button } from "@/components/ui/button";

// Vacant-room panel (replaces the resident card): status note + inert
// "Assign a resident" action.
export function RoomStatusCard({ note }: { note: string }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <div className="text-[12px] font-bold uppercase tracking-[0.4px] text-status-available">
        Room status
      </div>
      <p className="mt-3 text-[15px] leading-[1.6] text-ink-nav">{note}</p>
      <Button
        type="button"
        className="mt-4 h-auto rounded-[11px] bg-navy px-[18px] py-[11px] text-[14px] font-semibold text-cream hover:bg-navy/90"
      >
        Assign a resident
      </Button>
    </div>
  );
}
