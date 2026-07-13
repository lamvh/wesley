import { Photo } from "@/components/shared/photo";
import { cn } from "@/lib/utils";

// One recent-highlight gallery card: photo, category eyebrow, title.
// `eyebrowClass` carries the category colour (paired with the label text).
export function HighlightCard({
  slot,
  alt,
  eyebrow,
  eyebrowClass,
  title,
}: {
  slot: string;
  alt: string;
  eyebrow: string;
  eyebrowClass: string;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-cream-2">
      <div className="relative h-[150px]">
        <Photo slot={slot} alt={alt} placeholder={alt} />
      </div>
      <div className="px-[14px] py-3">
        <div className={cn("text-[11.5px] font-bold", eyebrowClass)}>
          {eyebrow}
        </div>
        <div className="mt-[2px] text-[14px] font-semibold text-ink">{title}</div>
      </div>
    </div>
  );
}
