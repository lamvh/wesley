import { Photo } from "@/components/shared/photo";

// Intro split: exterior photo left, heading + copy right.
export function PhotoCopySplit() {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-2 items-center gap-[52px] px-7 py-[60px] max-md:grid-cols-1">
      <div className="relative h-[340px] overflow-hidden rounded-[20px]">
        <Photo
          slot="home-exterior"
          alt="Exterior or lounge"
          placeholder="Exterior or lounge"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div>
        <h2 className="font-serif text-[30px] font-medium">
          Built around people, not corridors
        </h2>
        <p className="mt-4 text-[16px] leading-[1.7] text-ink-soft">
          We keep Wesley deliberately small. Wings are short and easy to
          navigate, lounges are warm and lived-in, and the garden is never more
          than a few steps away. It&apos;s a place that feels like home from the
          first visit.
        </p>
      </div>
    </section>
  );
}
