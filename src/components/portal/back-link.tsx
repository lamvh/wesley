import Link from "next/link";

// Shared text back link ("‹ {label}") used by room + resident detail screens.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-block pb-[14px] text-[14px] font-semibold text-ink-muted"
    >
      ‹ {label}
    </Link>
  );
}
