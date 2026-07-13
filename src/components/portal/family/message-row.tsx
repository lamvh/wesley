import type { Message } from "@/types/domain";

// Family message line: sender · time on top, message text below.
export function MessageRow({ message }: { message: Message }) {
  return (
    <div className="border-b border-line-divider py-[11px]">
      <div className="text-[13.5px] text-ink-soft">
        <span className="font-semibold">{message.from}</span> · {message.time}
      </div>
      <div className="mt-[3px] text-[13px] text-ink-meta">{message.text}</div>
    </div>
  );
}
