import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { JobRole } from "@/types/domain";

// One open-role row: title/type/desc left, "Apply now" → /contact right.
export function RoleRow({ role }: { role: JobRole }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-[14px] border border-line bg-cream-2 px-6 py-5">
      <div className="min-w-[220px] flex-1">
        <div className="font-serif text-[20px] font-semibold text-ink">
          {role.title}
        </div>
        <div className="mt-0.5 text-[13px] text-ink-faint">{role.type}</div>
        <p className="mt-2 text-[14px] leading-[1.55] text-ink-muted">
          {role.desc}
        </p>
      </div>
      <Button
        asChild
        className="h-auto rounded-[11px] bg-navy px-5 py-[11px] text-[14px] font-semibold text-cream hover:bg-navy/90"
      >
        <Link href="/contact">Apply now</Link>
      </Button>
    </div>
  );
}
