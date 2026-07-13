// Shared header row for portal screens: serif title + sub, optional actions.
export function PortalPageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[32px] font-medium tracking-[-0.3px]">
          {title}
        </h1>
        <p className="mt-[5px] text-[15px] text-ink-muted">{sub}</p>
      </div>
      {actions && <div className="flex gap-[10px]">{actions}</div>}
    </div>
  );
}
