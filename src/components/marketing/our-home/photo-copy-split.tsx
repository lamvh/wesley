import { Photo } from "@/components/shared/photo";

// Intro split: exterior photo left, heading + copy right. Copy from the CMS.
export function PhotoCopySplit({
  intro,
}: {
  intro: { introH2: string; introBody: string };
}) {
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
        <h2 className="font-serif text-[30px] font-medium">{intro.introH2}</h2>
        <p className="mt-4 text-[16px] leading-[1.7] text-ink-soft">
          {intro.introBody}
        </p>
      </div>
    </section>
  );
}
