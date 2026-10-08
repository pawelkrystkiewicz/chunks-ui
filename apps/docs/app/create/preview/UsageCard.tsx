import { Chip, Progress } from "chunks-ui";
import { PreviewCard, PreviewCardHeading } from "./PreviewCard";

const METERS = [
  { label: "Storage", amount: "72.4 / 100 GB", value: 72 },
  { label: "Bandwidth", amount: "380 GB / 1 TB", value: 38 },
];

export function UsageCard() {
  return (
    <PreviewCard>
      <PreviewCardHeading title="Usage" description="Current billing period" />
      {METERS.map((m) => (
        <Progress.Root key={m.label} value={m.value} className="flex flex-col gap-2">
          <div className="flex justify-between text-[0.9286em]">
            <span>{m.label}</span>
            <span className="text-muted-foreground">{m.amount}</span>
          </div>
          <Progress.Track className="h-1.5">
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ))}
      <div className="flex flex-wrap gap-2 border-border border-t pt-4">
        <Chip color="primary">New</Chip>
        <Chip color="success">Active</Chip>
        <Chip color="warning">Pending</Chip>
        <Chip color="destructive">Failed</Chip>
        <Chip color="secondary">Draft</Chip>
      </div>
    </PreviewCard>
  );
}
