import { Progress, Tabs, Textarea } from "chunks-ui";
import { PreviewCard } from "./PreviewCard";

const STATS = [
  { label: "Total", value: 8 },
  { label: "Active", value: 3 },
  { label: "Done", value: 2 },
];

const ACTIVITY = [
  { who: "Alice", what: "merged #482", when: "12 minutes ago", active: true },
  { who: "Bob", what: "moved Onboarding to review", when: "1 hour ago" },
  { who: "Eve", what: "commented on Billing", when: "Yesterday" },
];

// min-w-0: in a narrow column a wide (e.g. monospace) label eats into its tab's padding
// instead of pushing the tab list past the card's padding.
const tabClass =
  "h-[calc(var(--spacing-ui-height)-6px)] min-w-0 flex-1 rounded-md px-3 py-0 text-[0.9286em]";

export function TabsCard() {
  return (
    <PreviewCard>
      <Tabs.Root defaultValue="overview" className="flex flex-col gap-5">
        <Tabs.List className="gap-1 rounded-md">
          <Tabs.Tab value="overview" className={tabClass}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="activity" className={tabClass}>
            Activity
          </Tabs.Tab>
          <Tabs.Tab value="notes" className={tabClass}>
            Notes
          </Tabs.Tab>
          {/* renderBeforeHydration: /create is server-rendered, so the pill is in the first paint */}
          <Tabs.Indicator renderBeforeHydration />
        </Tabs.List>
        {/* Tabs.Animate rather than Tabs.Contents: Contents clips the Note field's focus outline,
            and its Tabs.Content panels aren't labelled by their tabs as Tabs.Panel is */}
        <Tabs.Animate>
          <Tabs.Panel value="overview" className="mt-0 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5 rounded-lg bg-muted p-3">
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                  <span className="font-heading font-semibold text-[1.57em]">{s.value}</span>
                </div>
              ))}
            </div>
            <Progress.Root value={25} aria-label="Sprint 14" className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sprint 14</span>
                <span className="font-semibold">25%</span>
              </div>
              <Progress.Track className="h-1.5">
                <Progress.Indicator />
              </Progress.Track>
            </Progress.Root>
          </Tabs.Panel>
          <Tabs.Panel value="activity" className="mt-0 flex flex-col gap-4">
            {ACTIVITY.map((a) => (
              <div key={a.who} className="flex gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${a.active ? "bg-primary" : "bg-muted-foreground"}`}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    <strong className="font-semibold">{a.who}</strong> {a.what}
                  </span>
                  <span className="text-muted-foreground text-xs">{a.when}</span>
                </span>
              </div>
            ))}
          </Tabs.Panel>
          <Tabs.Panel value="notes" className="mt-0">
            <Textarea
              aria-label="Note"
              placeholder="Write a note for the team…"
              className="min-h-24 resize-none leading-normal"
            />
          </Tabs.Panel>
        </Tabs.Animate>
      </Tabs.Root>
    </PreviewCard>
  );
}
