import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/shared/photo";

// Navy "Find us" panel: address + book-a-visit CTA left, map right.
export function FindUsPanel() {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-16">
      <div className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-navy max-md:grid-cols-1">
        <div className="p-11">
          <div className="text-[12px] font-bold uppercase tracking-[1.6px] text-gold">
            Find us
          </div>
          <h2 className="mt-[14px] font-serif text-[30px] font-medium text-hero-title">
            227 Mt Eden Rd
          </h2>
          <p className="mt-3 text-[16px] leading-[1.65] text-hero-meta">
            Mt Eden, Tāmaki Makaurau — a short walk from the village, with
            off-street parking for visitors.
          </p>
          <Button
            asChild
            className="mt-6 h-auto rounded-[11px] bg-cream px-[22px] py-[13px] text-[15px] font-semibold text-ink hover:bg-cream/90"
          >
            <Link href="/contact">Book a visit</Link>
          </Button>
        </div>
        <div className="relative min-h-[280px]">
          <Photo
            slot="home-map"
            alt="Map or street view"
            placeholder="Map or street view"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
