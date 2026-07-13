import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { DayTimeline } from "@/components/marketing/day-timeline";
import { PhotoMosaic } from "@/components/marketing/photo-mosaic";
import { getFeatures, getDayTimeline } from "@/lib/mock-data";

export default function LifeHerePage() {
  return (
    <>
      <MarketingPageHeader
        eyebrow="Life here"
        title="Days full of small, good things"
        intro="Good food, good company and something to look forward to every day. Here's a little of what life looks like at Wesley."
      />
      <section className="mx-auto max-w-[1200px] px-7 pt-[60px] pb-5">
        <FeatureGrid features={getFeatures()} />
      </section>
      <section className="mx-auto max-w-[1200px] px-7 pt-[30px] pb-10">
        <h2 className="mb-[26px] font-serif text-[30px] font-medium">
          A day at Wesley
        </h2>
        <DayTimeline steps={getDayTimeline()} />
      </section>
      <section className="mx-auto max-w-[1200px] px-7 pt-5 pb-16">
        <PhotoMosaic />
      </section>
    </>
  );
}
