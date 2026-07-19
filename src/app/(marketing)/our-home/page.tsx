import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { PhotoCopySplit } from "@/components/marketing/our-home/photo-copy-split";
import { FacilityCard } from "@/components/marketing/our-home/facility-card";
import { WingCard } from "@/components/marketing/our-home/wing-card";
import { FindUsPanel } from "@/components/marketing/our-home/find-us-panel";
import { getSiteContent } from "@/lib/data/site-content";

export default async function OurHomePage() {
  const c = await getSiteContent();
  const { ourhome } = c;

  return (
    <>
      <MarketingPageHeader
        eyebrow="Our home"
        title={ourhome.h1}
        intro={ourhome.sub}
      />

      <PhotoCopySplit intro={ourhome} />

      <section className="border-y border-line bg-cream-2">
        <div className="mx-auto max-w-[1200px] px-7 py-[60px]">
          <h2 className="mb-[26px] font-serif text-[30px] font-medium">
            {ourhome.facHeading}
          </h2>
          <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
            {c.facilities.map((f) => (
              <FacilityCard key={f.title} facility={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-7 py-[60px]">
        <h2 className="mb-[26px] font-serif text-[30px] font-medium">
          {ourhome.roomStylesHeading}
        </h2>
        <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
          {c.careWings.map((w) => (
            <WingCard key={w.name} wing={w} />
          ))}
        </div>
      </section>

      <FindUsPanel find={ourhome} />
    </>
  );
}
