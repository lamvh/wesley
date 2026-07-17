import Link from "next/link";
import { Photo } from "@/components/shared/photo";

const CHECKLIST = [
  "Daily wellbeing updates & photos",
  "Book visits and join activities",
  "Message the care team securely",
];

// Navy band promoting the new family portal: copy + checklist on the left,
// a sample daily-update card on the right.
export function FamilyTeaser() {
  return (
    <section className="bg-navy text-cream-warm">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 items-center gap-14 px-7 py-[82px] max-md:grid-cols-1">
        <div>
          <span className="inline-block rounded-full bg-gold/[0.16] px-3 py-[6px] text-[12px] font-bold uppercase tracking-[1.6px] text-gold">
            New
          </span>
          <h2 className="mt-[18px] font-serif text-[40px] font-medium leading-[1.1] text-hero-title">
            Stay close, wherever you are
          </h2>
          <p className="mt-[18px] text-[17px] leading-[1.7] text-hero-meta">
            Our new family portal keeps whānau in the loop - daily photos and
            updates from carers, upcoming visits, activity sign-ups and secure
            messaging with the care team.
          </p>
          <div className="mt-[26px] flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-[15.5px] text-cream-warm"
              >
                <span className="font-bold text-gold">✓</span> {item}
              </div>
            ))}
          </div>
          <Link
            href="/portal/family"
            className="mt-7 inline-block rounded-[12px] bg-cream px-6 py-[14px] text-[15.5px] font-semibold text-ink"
          >
            Preview the family portal
          </Link>
        </div>

        <div className="rounded-[20px] bg-cream p-[18px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.5)]">
          <div className="flex items-center gap-[10px] border-b border-line px-[6px] pb-[14px] pt-[6px]">
            <div className="flex size-[34px] items-center justify-center rounded-[9px] bg-bronze text-[13px] font-bold text-cream">
              PW
            </div>
            <div className="leading-[1.1]">
              <div className="text-[14.5px] font-bold text-ink">
                Peggy Whitcombe · Room 12
              </div>
              <div className="text-[12px] text-ink-meta">
                Today&rsquo;s update from Aroha
              </div>
            </div>
          </div>
          <div className="relative mt-[14px] h-[150px] overflow-hidden rounded-[12px]">
            <Photo slot="vme-fam" alt="Activity photo" placeholder="Activity photo" />
          </div>
          <p className="mb-[6px] mt-[14px] px-1 text-[14px] leading-[1.6] text-ink-nav">
            &ldquo;Peggy joined the garden group this morning and picked the
            first of the sweet peas - she was thrilled. Ate a good lunch and is
            resting well. 🌿&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
