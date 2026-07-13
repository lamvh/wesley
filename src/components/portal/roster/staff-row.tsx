import { PersonBadge } from "@/components/shared/person-badge";
import type { StaffMember } from "@/types/domain";

// One staff member within a shift column: avatar + name + role·wing meta.
export function StaffRow({ member }: { member: StaffMember }) {
  return (
    <div className="flex items-center gap-3 rounded-[11px] px-2 py-[10px] transition-colors hover:bg-cream">
      <PersonBadge
        initials={member.initials}
        color={member.color}
        className="size-[38px] rounded-full text-[12.5px]"
      />
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink">{member.name}</div>
        <div className="text-[12px] text-ink-faint">
          {member.role} · {member.wing}
        </div>
      </div>
    </div>
  );
}
