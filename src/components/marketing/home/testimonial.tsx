import { getTestimonial } from "@/lib/mock-data";

// Centered pull-quote with a large open-quote glyph and attribution.
export function Testimonial() {
  const { quote, author } = getTestimonial();
  return (
    <section className="mx-auto max-w-[900px] px-7 py-[86px] text-center">
      <div className="h-[28px] font-serif text-[56px] leading-[0] text-line-strong">
        &ldquo;
      </div>
      <p className="m-0 font-serif text-[29px] italic leading-[1.42] text-ink-soft">
        {quote}
      </p>
      <div className="mt-6 text-[14.5px] font-semibold text-ink-muted">
        {author}
      </div>
    </section>
  );
}
