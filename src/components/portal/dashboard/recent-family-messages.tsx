import Link from "next/link";
import { PersonBadge } from "@/components/shared/person-badge";
import type { Dashboard } from "@/types/domain";

// Recent family messages card: avatar + author·resident + preview + time.
// The header "Open portal" link is real navigation to the family portal.
export function RecentFamilyMessages({
  posts,
}: {
  posts: Dashboard["familyPosts"];
}) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-serif text-[20px] font-semibold">Recent family messages</h3>
        <Link
          href="/portal/family"
          className="text-[13px] font-semibold text-bronze-text"
        >
          Open portal
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-[2px]">
        {posts.map((p) => (
          <div
            key={`${p.from}-${p.resident}`}
            className="flex gap-[13px] border-b border-line-divider py-3"
          >
            <PersonBadge
              initials={p.initials}
              color={p.color}
              className="size-9 rounded-full text-[12.5px]"
            />
            <div className="flex-1">
              <div className="text-[13.5px] text-ink-soft">
                <span className="font-semibold">{p.from}</span> · {p.resident}
              </div>
              <div className="mt-[2px] text-[13px] text-ink-muted">{p.preview}</div>
            </div>
            <div className="whitespace-nowrap text-[12px] text-ink-faint">{p.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
