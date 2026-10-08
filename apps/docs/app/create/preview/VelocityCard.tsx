import { TrendingUp } from "lucide-react";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const SPRINTS = [
  { label: "S9", completed: 62, committed: 74 },
  { label: "S10", completed: 70, committed: 78 },
  { label: "S11", completed: 58, committed: 80 },
  { label: "S12", completed: 76, committed: 82 },
  { label: "S13", completed: 84, committed: 86 },
  { label: "S14", completed: 94, committed: 90 },
];

export function VelocityCard() {
  return (
    <PreviewCard>
      <div className="flex items-start justify-between gap-3">
        <PreviewCardHeading title="Velocity" description="Story points, last 6 sprints" />
        <span className="inline-flex items-center gap-1 font-semibold text-success text-xs">
          <TrendingUp className="size-3.5" />
          12%
        </span>
      </div>
      <div className="grid h-[140px] grid-cols-6 items-end gap-3">
        {SPRINTS.map((s) => (
          <div key={s.label} className="flex h-full items-end gap-[3px]">
            <div className="flex-1 rounded-t-sm bg-chart-1" style={{ height: `${s.completed}%` }} />
            <div className="flex-1 rounded-t-sm bg-chart-2" style={{ height: `${s.committed}%` }} />
          </div>
        ))}
      </div>
      <div className="-mt-3 grid grid-cols-6 gap-3 text-center text-muted-foreground text-xs">
        {SPRINTS.map((s) => (
          <span key={s.label}>{s.label}</span>
        ))}
      </div>
      <div className="flex gap-4 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-chart-1" />
          Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-chart-2" />
          Committed
        </span>
      </div>
    </PreviewCard>
  );
}
