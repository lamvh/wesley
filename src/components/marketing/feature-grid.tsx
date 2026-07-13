import { Icon } from "@/components/shared/icons";
import type { Feature } from "@/types/domain";

// Shared 3-col feature grid (home "Life at Wesley" section + life-here page).
export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid grid-cols-3 gap-[18px] max-md:grid-cols-1">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-2xl border border-line bg-cream-2 p-[26px]"
        >
          <div className="flex size-[46px] items-center justify-center rounded-xl bg-navy-tint text-navy">
            <Icon name={f.icon} />
          </div>
          <h3 className="mt-4 font-serif text-[21px] font-semibold">{f.title}</h3>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-muted">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
