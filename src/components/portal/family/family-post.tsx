import { PersonBadge } from "@/components/shared/person-badge";
import { Photo } from "@/components/shared/photo";
import type { FamilyPost as FamilyPostData } from "@/types/domain";

// One whānau feed entry: avatar + resident/by-line + tag pill, body text,
// and an optional photo frame when the post carries an image slot.
export function FamilyPost({ post }: { post: FamilyPostData }) {
  return (
    <article className="rounded-2xl border border-line bg-cream-2 p-[18px]">
      <div className="flex items-center gap-3">
        <PersonBadge
          initials={post.initials}
          color={post.color}
          className="size-10 rounded-full text-[13px]"
        />
        <div className="flex-1">
          <div className="text-[14.5px] font-semibold text-ink">{post.resident}</div>
          <div className="text-[12.5px] text-ink-faint">
            {post.by} · {post.time}
          </div>
        </div>
        <span className="rounded-full bg-sage-tint px-[11px] py-[5px] text-[12px] font-semibold text-sage">
          {post.tag}
        </span>
      </div>
      <p className="mt-[14px] text-[14.5px] leading-[1.62] text-ink-nav">{post.text}</p>
      {post.photoSlot && (
        <div className="relative mt-[14px] h-[180px] overflow-hidden rounded-[12px]">
          <Photo
            slot={post.photoSlot}
            alt={`Photo shared about ${post.resident}`}
            placeholder="Photo for whānau"
          />
        </div>
      )}
    </article>
  );
}
