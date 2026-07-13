import Link from "next/link";

const COLUMNS = [
  {
    heading: "Our rooms",
    links: ["VIP suites", "Premium suites", "Normal rooms", "Rest-home care"],
  },
  {
    heading: "Our home",
    links: ["Life here", "Our team", "Careers", "News"],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-footer text-on-navy">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 px-7 pb-[30px] pt-14 max-md:grid-cols-2">
        <div>
          <div className="flex items-center gap-[11px]">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-navy font-serif text-[20px] text-gold">
              W
            </span>
            <span className="font-serif text-[18px] text-cream">
              Wesley Home &amp; Care
            </span>
          </div>
          <p className="mt-4 max-w-[280px] text-[14px] leading-[1.65]">
            Boutique aged residential care in the heart of Mt Eden, Tāmaki
            Makaurau. Certified by the Ministry of Health.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <div className="mb-3 text-[14px] font-bold text-cream-warm">
              {col.heading}
            </div>
            <div className="flex flex-col gap-[9px] text-[14px]">
              {col.links.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-3 text-[14px] font-bold text-cream-warm">Access</div>
          <div className="flex flex-col gap-[9px] text-[14px]">
            <Link href="/portal/family" className="text-on-navy hover:text-cream-warm">
              Family login
            </Link>
            <Link href="/portal" className="text-on-navy hover:text-cream-warm">
              Staff portal
            </Link>
            <Link href="/contact" className="text-on-navy hover:text-cream-warm">
              Contact
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-footer-border">
        <div className="mx-auto flex max-w-[1200px] justify-between px-7 py-[18px] text-[12.5px] text-on-navy-faint">
          <span>© 2026 Wesley Home &amp; Care · Privacy · Terms</span>
        </div>
      </div>
    </footer>
  );
}
