import { Chip } from "chunks-ui";
import { PreviewCard } from "./PreviewCard";

const BARS = [38, 52, 44, 61, 55, 70, 64, 78, 72, 86, 80, 100];

export function UsersCard() {
  return (
    <PreviewCard className="gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm">Monthly active users</span>
        <Chip color="success">+12.5%</Chip>
      </div>
      <div className="font-heading text-[2.43em] font-semibold leading-none tracking-[-0.03em]">
        2,481
      </div>
      <div className="flex h-12 items-end gap-1" aria-hidden="true">
        {BARS.map((h, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t-sm rounded-b-[2px] ${
              i === BARS.length - 1
                ? "bg-primary"
                : "bg-[color-mix(in_oklch,var(--primary)_30%,transparent)]"
            }`}
          />
        ))}
      </div>
    </PreviewCard>
  );
}
