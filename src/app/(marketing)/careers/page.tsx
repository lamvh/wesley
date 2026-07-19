import Link from "next/link";
import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { BenefitCard } from "@/components/marketing/careers/benefit-card";
import { RoleRow } from "@/components/marketing/careers/role-row";
import { getSiteContent } from "@/lib/data/site-content";
import { getJobRoles } from "@/lib/mock-data";

export default async function CareersPage() {
  const c = await getSiteContent();
  const benefits = c.benefits;
  const roles = getJobRoles();

  return (
    <>
      <MarketingPageHeader
        eyebrow="Careers"
        title={c.careers.h1}
        intro={c.careers.sub}
      />

      <section className="mx-auto max-w-[1200px] px-7 pb-5 pt-[56px]">
        <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
          {benefits.map((b) => (
            <BenefitCard key={b.title} benefit={b} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-7 pb-16 pt-[30px]">
        <h2 className="mb-5 font-serif text-[30px] font-medium">Open roles</h2>
        <div className="flex flex-col gap-3">
          {roles.map((r) => (
            <RoleRow key={r.title} role={r} />
          ))}
        </div>
        <div className="mt-[14px] rounded-[14px] border border-dashed border-line-strong bg-cream-2 px-6 py-[22px] text-center">
          <p className="text-[15px] text-ink-soft">
            Don&apos;t see your role? We&apos;re always glad to hear from good
            people -{" "}
            <Link
              href="/contact"
              className="font-semibold text-bronze-text"
            >
              get in touch
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
