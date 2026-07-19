import { FeatureGrid } from "@/components/marketing/feature-grid";
import { CareLevelsSection } from "@/components/marketing/home/care-levels-section";
import { EnquiryCta } from "@/components/marketing/home/enquiry-cta";
import { FamilyTeaser } from "@/components/marketing/home/family-teaser";
import { Hero } from "@/components/marketing/home/hero";
import { Testimonial } from "@/components/marketing/home/testimonial";
import { WelcomeSection } from "@/components/marketing/home/welcome-section";
import { getSiteContent } from "@/lib/data/site-content";
import { FEATURE_ICONS, CARE_SLOTS } from "@/lib/mock-data/site-content-defaults";

export default async function HomePage() {
  const c = await getSiteContent();
  const features = c.features.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }));
  const roomStyles = c.careLevels.map((r, i) => ({ ...r, slot: CARE_SLOTS[i] }));

  return (
    <>
      <Hero hero={c.hero} />
      <WelcomeSection welcome={c.welcome} />
      <CareLevelsSection header={c.homeRooms} roomStyles={roomStyles} />

      {/* Life at Wesley - centered header + 3×2 feature grid */}
      <section className="mx-auto max-w-[1200px] px-7 py-[86px]">
        <div className="mx-auto max-w-[620px] text-center">
          <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
            {c.homeLife.eyebrow}
          </div>
          <h2 className="mt-[14px] font-serif text-[40px] font-medium tracking-[-0.3px]">
            {c.homeLife.h2}
          </h2>
        </div>
        <div className="mt-11">
          <FeatureGrid features={features} />
        </div>
      </section>

      <FamilyTeaser family={c.family} />
      <Testimonial testimonial={c.testimonial} />
      <EnquiryCta enquiry={c.enquiry} />
    </>
  );
}
