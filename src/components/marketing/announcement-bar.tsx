import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-navy px-5 py-[9px] text-center text-[13.5px] tracking-[0.2px] text-cream-warm">
      Now taking enquiries for our new VIP &amp; premium suites -{" "}
      <Link href="/contact" className="text-cream-warm underline hover:text-cream-warm">
        book a visit this week ›
      </Link>
    </div>
  );
}
