import { cn } from "@/lib/utils";

// Care-flag pill. Each flag maps to a severity-adjacent tint from the design
// system's semantic scales; unmapped flags fall back to the sage tint.
const FLAG_BADGE: Record<string, string> = {
  "Falls watch": "bg-rust-tint text-rust",
  "Diabetic": "bg-sage-tint text-sage",
  "Hearing aid": "bg-cat-move-tint text-cat-move",
  "Dementia care": "bg-navy-tint text-navy",
  "Thickened fluids": "bg-cat-craft-tint text-cat-craft",
  "Hoist transfer": "bg-navy-tint text-status-available",
  "Wheelchair": "bg-navy-tint text-status-available",
  "Walking stick": "bg-navy-tint text-status-available",
  "Finger foods": "bg-sage-tint text-sage",
  "Vegetarian": "bg-sage-tint text-sage",
  "Gluten free": "bg-sage-tint text-sage",
  "Independent": "bg-sage-tint text-sage",
  "Respite stay": "bg-gold-tint text-gold-text",
};

export function CareFlag({ label }: { label: string }) {
  const badge = FLAG_BADGE[label] ?? "bg-sage-tint text-sage";
  return (
    <span
      className={cn("rounded-full px-3 py-1.5 text-[13px] font-semibold", badge)}
    >
      {label}
    </span>
  );
}
