import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { PhotoCopySplit } from "@/components/marketing/our-home/photo-copy-split";
import { FacilityCard } from "@/components/marketing/our-home/facility-card";
import { WingCard } from "@/components/marketing/our-home/wing-card";
import { FindUsPanel } from "@/components/marketing/our-home/find-us-panel";
import { getFacilities, getCareWings } from "@/lib/mock-data";

export default function OurHomePage() {
  const facilities = getFacilities();
  const careWings = getCareWings();

  return (
    <>
      <MarketingPageHeader
        eyebrow="Our home"
        title="A boutique home in the heart of Mt Eden"
        intro="Fifty-four suites wrapped around sunny gardens and shared spaces made for company."
      />

      <PhotoCopySplit />

      <section className="border-y border-line bg-cream-2">
        <div className="mx-auto max-w-[1200px] px-7 py-[60px]">
          <h2 className="mb-[26px] font-serif text-[30px] font-medium">
            Facilities
          </h2>
          <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
            {facilities.map((f) => (
              <FacilityCard key={f.title} facility={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-7 py-[60px]">
        <h2 className="mb-[26px] font-serif text-[30px] font-medium">
          Our three room styles
        </h2>
        <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
          {careWings.map((w) => (
            <WingCard key={w.name} wing={w} />
          ))}
        </div>
      </section>

      <FindUsPanel />
    </>
  );
}
