import Link from "next/link";
import { Photo } from "@/components/shared/photo";
import { getStats } from "@/lib/mock-data";

// Full-bleed hero: background photo, left→right dark scrim, headline + CTAs,
// and a stats strip pinned to the bottom-left.
export function Hero() {
  const stats = getStats();
  return (
    <section className="relative h-[640px] overflow-hidden max-sm:h-auto max-sm:min-h-[520px]">
      <div className="absolute inset-0">
        <Photo
          slot="vme-hero"
          alt="Wesley Home &amp; Care garden and grounds"
          placeholder="Drop a hero photo - garden, lounge, or exterior"
          priority
        />
      </div>

      {/* left→right dark scrim, tokenised via the ink color */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink/75 via-ink/35 to-transparent" />

      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-[1200px] px-7">
          <div className="max-w-[600px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/[0.16] px-[13px] py-[6px] text-[12.5px] font-semibold uppercase tracking-[0.4px] text-cream">
              Boutique aged care · Est. 1998
            </span>
            <h1 className="mt-5 font-serif text-[62px] font-medium leading-[1.03] tracking-[-0.5px] text-hero-title max-md:text-[44px] max-sm:text-[40px] max-sm:leading-[1.05]">
              A warm place to call home, in the heart of Mt&nbsp;Eden
            </h1>
            <p className="mt-5 max-w-[500px] text-[18.5px] leading-[1.6] text-hero-body">
              Boutique rest-home care in three room styles - VIP, premium and
              comfortable - with the garden, kitchen and whānau warmth that make
              a house a home.
            </p>
            <div className="pointer-events-auto mt-[30px] flex gap-[14px] max-sm:flex-col">
              <Link
                href="/contact"
                className="rounded-[12px] bg-cream px-[26px] py-[15px] text-[16px] font-semibold text-ink"
              >
                Book a visit
              </Link>
              <Link
                href="/our-rooms"
                className="rounded-[12px] border border-cream/[0.42] bg-cream/[0.14] px-[26px] py-[15px] text-[16px] font-semibold text-cream"
              >
                Explore our rooms
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-[1200px] gap-[38px] px-7 pb-[26px]">
          {stats.map((s) => (
            <div key={s.label} className="text-cream">
              <div className="font-serif text-[30px]">{s.value}</div>
              <div className="text-[12.5px] tracking-[0.3px] text-hero-meta">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
