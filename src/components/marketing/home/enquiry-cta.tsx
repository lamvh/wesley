import { Button } from "@/components/ui/button";
import type { SiteContent } from "@/lib/mock-data/site-content-defaults";

// Rounded cream panel: contact details on the left, an inert enquiry form on
// the right. Submit does not POST this phase. Copy comes from the CMS.
export function EnquiryCta({ enquiry }: { enquiry: SiteContent["enquiry"] }) {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-[88px]">
      <div className="grid grid-cols-[1.2fr_1fr] items-center gap-12 rounded-[24px] border border-line bg-cream-2 p-[52px] max-md:grid-cols-1 max-md:p-8">
        <div>
          <h2 className="m-0 font-serif text-[36px] font-medium tracking-[-0.3px]">
            {enquiry.h2}
          </h2>
          <p className="mt-[14px] text-[16.5px] leading-[1.65] text-ink-muted">
            {enquiry.body}
          </p>
          <div className="mt-[26px] flex flex-wrap gap-[26px]">
            <div>
              <div className="text-[12.5px] tracking-[0.4px] text-ink-meta">
                Call us
              </div>
              <div className="font-serif text-[22px] text-navy">
                {enquiry.phone}
              </div>
            </div>
            <div>
              <div className="text-[12.5px] tracking-[0.4px] text-ink-meta">
                Visit
              </div>
              <div className="font-serif text-[22px] text-navy">
                {enquiry.address}
              </div>
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            className="rounded-[11px] border border-field bg-cream px-4 py-[14px] text-[15px] text-ink placeholder:text-ink-meta"
          />
          <input
            type="text"
            placeholder="Phone or email"
            className="rounded-[11px] border border-field bg-cream px-4 py-[14px] text-[15px] text-ink placeholder:text-ink-meta"
          />
          <textarea
            rows={3}
            placeholder="How can we help?"
            className="resize-none rounded-[11px] border border-field bg-cream px-4 py-[14px] text-[15px] text-ink placeholder:text-ink-meta"
          />
          <Button
            type="button"
            className="h-auto rounded-[11px] py-[15px] text-[16px] font-semibold"
          >
            Request a visit
          </Button>
        </form>
      </div>
    </section>
  );
}
