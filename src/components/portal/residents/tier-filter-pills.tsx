"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TIERS = ["All", "VIP", "Premium", "Normal"] as const;

// Visual-only care-tier filter. Holds local active state and restyles the
// active pill; it does not filter the grid this phase.
export function TierFilterPills() {
  const [active, setActive] = useState<(typeof TIERS)[number]>("All");
  return (
    <div className="flex gap-1.5 rounded-full border border-field bg-cream-3 p-1">
      {TIERS.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => setActive(tier)}
          className={cn(
            "rounded-full px-[13px] py-1.5 text-[13px] font-semibold",
            active === tier ? "bg-navy text-cream" : "text-ink-muted",
          )}
        >
          {tier}
        </button>
      ))}
    </div>
  );
}
