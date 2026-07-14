import { cn } from "@/lib/utils";

// Shared header row for portal screens: optional uppercase eyebrow, serif
// title + sub, optional actions.
export function PortalPageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="text-[13px] font-bold tracking-[1.6px] uppercase text-bronze">
            {eyebrow}
          </div>
        )}
        <h1
          className={cn(
            "font-serif text-[32px] font-medium tracking-[-0.3px]",
            eyebrow && "mt-1",
          )}
        >
          {title}
        </h1>
        <p className="mt-[5px] text-[15px] text-ink-muted">{sub}</p>
      </div>
      {actions && <div className="flex gap-[10px]">{actions}</div>}
    </div>
  );
}
