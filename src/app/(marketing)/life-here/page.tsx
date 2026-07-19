import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { DayTimeline } from "@/components/marketing/day-timeline";
import { PhotoMosaic } from "@/components/marketing/photo-mosaic";
import { getSiteContent } from "@/lib/data/site-content";
import { FEATURE_ICONS } from "@/lib/mock-data/site-content-defaults";

export default async function LifeHerePage() {
  const c = await getSiteContent();
  const features = c.features.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }));
  return (
    <>
      <MarketingPageHeader
        eyebrow="Life here"
        title={c.life.h1}
        intro={c.life.sub}
      />
      <section className="mx-auto max-w-[1200px] px-7 pt-[60px] pb-5">
        <FeatureGrid features={features} />
      </section>
      <section className="mx-auto max-w-[1200px] px-7 pt-[30px] pb-10">
        <h2 className="mb-[26px] font-serif text-[30px] font-medium">
          {c.life.dayHeading}
        </h2>
        <DayTimeline steps={c.dayTimeline} />
      </section>
      <section className="mx-auto max-w-[1200px] px-7 pt-5 pb-16">
        <PhotoMosaic />
      </section>
    </>
  );
}
