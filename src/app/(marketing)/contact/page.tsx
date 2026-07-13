import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { Photo } from "@/components/shared/photo";
import { ContactDetails } from "@/components/marketing/contact/contact-details";
import { RequestVisitForm } from "@/components/marketing/contact/request-visit-form";
import { getContactInfo } from "@/lib/mock-data";

export default function ContactPage() {
  const contact = getContactInfo();

  return (
    <>
      <MarketingPageHeader
        eyebrow="Contact"
        title="Come and see for yourself"
        intro="Book a no-obligation visit, or call our team for a warm, honest chat about care options for your loved one."
      />

      <section className="mx-auto grid max-w-[1200px] grid-cols-[1fr_1.1fr] gap-[52px] px-7 py-[60px] max-md:grid-cols-1">
        <div>
          <ContactDetails contact={contact} />
          <div className="relative mt-7 h-[200px] overflow-hidden rounded-2xl">
            <Photo
              slot="contact-map"
              alt="Map or street view"
              placeholder="Map or street view"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        <RequestVisitForm />
      </section>
    </>
  );
}
