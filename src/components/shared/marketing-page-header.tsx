// Shared header band for interior marketing pages (our-rooms, life-here,
// our-home, careers, contact). Home uses a hero instead.
export function MarketingPageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="border-b border-line bg-cream-2">
      <div className="mx-auto max-w-[1200px] px-7 py-[60px]">
        <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
          {eyebrow}
        </div>
        <h1 className="mt-[14px] font-serif text-[46px] font-medium tracking-[-0.4px]">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 max-w-[580px] text-[17px] leading-[1.62] text-ink-muted">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
