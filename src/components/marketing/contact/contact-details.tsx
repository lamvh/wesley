import type { ContactInfo } from "@/types/domain";

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] font-semibold uppercase tracking-[0.4px] text-ink-meta">
      {children}
    </div>
  );
}

// Contact details stack: phone, address/suburb, email, visiting hours.
export function ContactDetails({ contact }: { contact: ContactInfo }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <DetailLabel>Call us</DetailLabel>
        <div className="mt-1 font-serif text-[26px] text-navy">
          {contact.phone}
        </div>
      </div>
      <div>
        <DetailLabel>Visit</DetailLabel>
        <div className="mt-1 font-serif text-[26px] text-navy">
          {contact.address}
        </div>
        <div className="text-[14px] text-ink-muted">{contact.suburb}</div>
      </div>
      <div>
        <DetailLabel>Email</DetailLabel>
        <div className="mt-1 font-serif text-[22px] text-navy">
          {contact.email}
        </div>
      </div>
      <div>
        <DetailLabel>Visiting hours</DetailLabel>
        <div className="mt-1 text-[15px] leading-[1.6] text-ink-soft">
          {contact.hours}
        </div>
      </div>
    </div>
  );
}
