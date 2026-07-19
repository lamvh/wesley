import { Photo } from "@/components/shared/photo";
import type { SiteContent } from "@/lib/mock-data/site-content-defaults";

// Fixed chip tints, applied to the CMS-editable welcome tags by index.
const TAG_TINTS = [
  "bg-sage-tint text-sage",
  "bg-rust-tint text-rust",
  "bg-amber-tint text-cat-move",
];

// 2-column welcome: intro copy with tint chips on the left, a 3-tile photo
// collage on the right. Copy comes from the CMS.
export function WelcomeSection({
  welcome,
}: {
  welcome: SiteContent["welcome"];
}) {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-[1.05fr_.95fr] items-center gap-16 px-7 py-[88px] max-md:grid-cols-1">
      <div>
        <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
          {welcome.eyebrow}
        </div>
        <h2 className="mt-4 font-serif text-[42px] font-medium leading-[1.1] tracking-[-0.3px]">
          {welcome.h2}
        </h2>
        <p className="mt-[22px] text-[17px] leading-[1.72] text-ink-muted">
          {welcome.body}
        </p>
        <div className="mt-[26px] flex flex-wrap gap-[10px]">
          {welcome.tags.map((tag, i) => (
            <span
              key={tag}
              className={`rounded-full px-[15px] py-2 text-[14px] font-semibold ${TAG_TINTS[i % TAG_TINTS.length]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 grid-rows-[180px_180px] gap-[14px]">
        <div className="relative row-span-2 overflow-hidden rounded-[18px]">
          <Photo slot="vme-w1" alt="A resident with their carer" placeholder="Resident & carer" />
        </div>
        <div className="relative overflow-hidden rounded-[18px]">
          <Photo slot="vme-w2" alt="The garden" placeholder="Garden" />
        </div>
        <div className="relative overflow-hidden rounded-[18px]">
          <Photo slot="vme-w3" alt="The dining room" placeholder="Dining" />
        </div>
      </div>
    </section>
  );
}
