import { cn } from "@/lib/utils";

// Toggle switch for one module/action permission cell. 42x23 rounded track,
// knob slides right when on. Locked (super_admin) renders dimmed + inert.
export function PermissionSwitch({
  on,
  locked = false,
  onToggle,
}: {
  on: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={locked}
      onClick={onToggle}
      className={cn(
        "relative h-[23px] w-[42px] shrink-0 rounded-full border-none p-0 transition-colors",
        on ? "bg-sage" : "bg-line-strong",
        locked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] block size-[17px] rounded-full bg-white shadow-sm transition-[left]",
          on ? "left-[22px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
