import { cn } from "chunks-ui";
import { Check, ChevronDown, CircleCheck, X } from "lucide-react";

// Static mocks of each component category. They sit inside a card link, so they are
// pictures, not live (interactive) components.

const BTN = "flex h-8 items-center justify-center rounded-lg px-3.5 font-medium text-[12.5px]";
const FIELD =
  "flex h-[35px] items-center rounded-lg border border-input bg-background outline-2 outline-ring outline-offset-2";

function Segmented({
  items,
  active,
  className,
}: {
  items: string[];
  active: number;
  className: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-[3px] rounded-lg bg-muted p-[3px]">
      {items.map((item, i) => (
        <span
          key={item}
          className={cn(
            "flex items-center justify-center font-medium text-[12px]",
            i === active
              ? "rounded-md bg-background shadow-[0_1px_2px_oklch(0_0_0/.08)]"
              : "text-muted-foreground",
            className,
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function InputsPreview() {
  return (
    <div className="flex w-[min(100%,236px)] flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-[12px]">Email</span>
        <div className={cn(FIELD, "gap-2 pr-2 pl-3")}>
          <span className="min-w-0 flex-1 text-[13px]">ada@chunk.dev</span>
          <span className="flex size-[18px] items-center justify-center rounded-full bg-muted text-muted-foreground">
            <X className="size-[11px]" strokeWidth={3} />
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <span className={cn(BTN, "flex-1 bg-primary text-primary-foreground")}>Save</span>
        <span className={cn(BTN, "border border-border")}>Cancel</span>
      </div>
    </div>
  );
}

export function SelectionPreview() {
  return (
    <div className="flex w-[min(100%,236px)] flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-[13px]">Notifications</span>
        <span className="relative h-5 w-9 rounded-full bg-primary">
          <span className="absolute top-0.5 left-[18px] size-4 rounded-full bg-white shadow-[0_1px_2px_oklch(0_0_0/.2)]" />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex size-4 items-center justify-center rounded-[5px] bg-primary text-primary-foreground">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
        <span className="text-[13px]">Remember me</span>
      </div>
      <Segmented items={["Day", "Week", "Month"]} active={1} className="h-6" />
      <div className="relative flex h-4 items-center">
        <span className="absolute inset-x-0 h-1 rounded-full bg-muted" />
        <span className="absolute left-0 h-1 w-[62%] rounded-full bg-primary" />
        <span className="absolute left-[calc(62%-8px)] size-4 rounded-full border-2 border-primary bg-background" />
      </div>
    </div>
  );
}

export function PickersPreview() {
  return (
    <div className="flex w-[min(100%,216px)] flex-col gap-1.5">
      <div className={cn(FIELD, "justify-between pr-2.5 pl-3")}>
        <span className="text-[13px]">Next.js</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-px rounded-[10px] border border-border bg-popover p-1 text-popover-foreground shadow-[0_10px_28px_-10px_oklch(0_0_0/.2)]">
        {["Next.js", "Remix", "Astro"].map((item, i) => (
          <div
            key={item}
            className={cn(
              "flex h-7 items-center justify-between rounded-md px-2 text-[12.5px]",
              i === 0 && "bg-accent",
            )}
          >
            <span>{item}</span>
            {i === 0 && <Check className="size-3.5" strokeWidth={2.5} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverlaysPreview() {
  return (
    <>
      <div className="absolute inset-0 bg-muted" />
      <div className="absolute inset-0 bg-[oklch(0_0_0/.28)]" />
      <div className="relative flex w-[min(100%,232px)] flex-col gap-3.5 rounded-[14px] border border-border bg-background p-4 shadow-[0_16px_40px_-12px_oklch(0_0_0/.35)]">
        <div className="flex flex-col gap-[3px]">
          <span className="font-semibold text-[14px] tracking-[-.01em]">Delete project?</span>
          <span className="text-muted-foreground text-[12px]">This removes 14 deployments.</span>
        </div>
        <div className="flex justify-end gap-1.5">
          <span className={cn(BTN, "h-[30px] border border-border px-3")}>Cancel</span>
          <span className={cn(BTN, "h-[30px] bg-destructive px-3 text-destructive-foreground")}>
            Delete
          </span>
        </div>
      </div>
    </>
  );
}

export function StructurePreview() {
  return (
    <div className="flex w-[min(100%,250px)] flex-col gap-2.5">
      <Segmented items={["Overview", "Activity", "Settings"]} active={0} className="h-[26px]" />
      <div className="flex flex-col">
        <div className="flex flex-col gap-1 border-border border-b px-0.5 pt-2 pb-2.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[13px]">Installation</span>
            <ChevronDown className="size-3.5 rotate-180 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground text-[12px]">
            Import theme.css once at the entry.
          </span>
        </div>
        <div className="flex items-center justify-between px-0.5 py-[9px]">
          <span className="font-medium text-[13px]">Motion</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

const AVATAR =
  "flex size-[26px] items-center justify-center rounded-full border-2 border-background font-semibold text-[9.5px]";
const CHIP = "rounded-full border px-2 py-px font-medium text-[11px]";

export function FeedbackPreview() {
  return (
    <div className="flex w-[min(100%,250px)] flex-col gap-3">
      <div className="flex items-start gap-2.5 rounded-[10px] border border-border bg-background px-3 py-2.5 shadow-[0_1px_2px_oklch(0_0_0/.05)]">
        <CircleCheck className="mt-px size-4 flex-none text-success" />
        <span className="flex flex-col gap-px">
          <span className="font-semibold text-[13px]">Deployed</span>
          <span className="text-muted-foreground text-[12px]">chunks-ui@0.1.0 is live.</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex">
          <span className={cn(AVATAR, "bg-primary/16 text-primary")}>AK</span>
          <span className={cn(AVATAR, "-ml-[7px] bg-muted text-muted-foreground")}>BR</span>
          <span className={cn(AVATAR, "-ml-[7px] bg-muted text-muted-foreground")}>+3</span>
        </span>
        <span className="flex gap-1">
          <span className={cn(CHIP, "border-primary/30 bg-primary/10 text-primary")}>New</span>
          <span className={cn(CHIP, "border-success/30 bg-success/12 text-[oklch(55%_.14_166)]")}>
            Active
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[64%] rounded-full bg-primary" />
      </div>
    </div>
  );
}
