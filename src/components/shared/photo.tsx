import Image from "next/image";
import { photoSrc } from "@/lib/mock-data/photos";
import { cn } from "@/lib/utils";

// Renders a real photo for a design image-slot id, or a labelled placeholder
// when the slot has no mapped file. Parent must be `relative` with a height.
export function Photo({
  slot,
  alt,
  placeholder,
  className,
  priority,
  sizes = "100vw",
}: {
  slot: string;
  alt: string;
  placeholder?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const src = photoSrc(slot);
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-line-soft/60 p-4 text-center text-[12px] font-medium text-ink-faint",
          className,
        )}
      >
        {placeholder ?? alt}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
