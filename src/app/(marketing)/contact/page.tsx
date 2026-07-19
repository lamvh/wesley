import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { Photo } from "@/components/shared/photo";
import { ContactDetails } from "@/components/marketing/contact/contact-details";
import { RequestVisitForm } from "@/components/marketing/contact/request-visit-form";
import { getSiteContent } from "@/lib/data/site-content";

export default async function ContactPage() {
  const c = await getSiteContent();
  const contact = {
    phone: c.contact.phone,
    address: c.contact.address,
    suburb: c.contact.addressSub,
    email: c.contact.email,
    hours: c.contact.hours,
  };

  return (
    <>
      <MarketingPageHeader
        eyebrow="Contact"
        title={c.contact.h1}
        intro={c.contact.sub}
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
