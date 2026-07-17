import { FeatureGrid } from "@/components/marketing/feature-grid";
import { CareLevelsSection } from "@/components/marketing/home/care-levels-section";
import { EnquiryCta } from "@/components/marketing/home/enquiry-cta";
import { FamilyTeaser } from "@/components/marketing/home/family-teaser";
import { Hero } from "@/components/marketing/home/hero";
import { Testimonial } from "@/components/marketing/home/testimonial";
import { WelcomeSection } from "@/components/marketing/home/welcome-section";
import { getFeatures } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WelcomeSection />
      <CareLevelsSection />

      {/* Life at Wesley - centered header + 3×2 feature grid */}
      <section className="mx-auto max-w-[1200px] px-7 py-[86px]">
        <div className="mx-auto max-w-[620px] text-center">
          <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
            Life at Wesley
          </div>
          <h2 className="mt-[14px] font-serif text-[40px] font-medium tracking-[-0.3px]">
            Days full of small, good things
          </h2>
        </div>
        <div className="mt-11">
          <FeatureGrid features={getFeatures()} />
        </div>
      </section>

      <FamilyTeaser />
      <Testimonial />
      <EnquiryCta />
    </>
  );
}
