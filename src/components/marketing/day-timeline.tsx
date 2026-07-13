import type { TimelineStep } from "@/types/domain";

// 4-col "A day at Wesley" timeline: each step topped by a bronze rule.
export function DayTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="grid grid-cols-4 gap-[18px] max-md:grid-cols-2">
      {steps.map((step) => (
        <div key={step.time} className="border-t-[3px] border-bronze pt-4">
          <div className="text-[12px] font-bold uppercase tracking-[1px] text-bronze-text">
            {step.time}
          </div>
          <h3 className="mt-2 font-serif text-[20px] font-semibold">{step.title}</h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-ink-muted">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
