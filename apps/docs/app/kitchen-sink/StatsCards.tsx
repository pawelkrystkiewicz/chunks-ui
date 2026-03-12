"use client";

import { Card, Progress, Tooltip } from "chunks-ui";
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { TASKS } from "./data";

const stats = [
  {
    label: "Total Tasks",
    value: TASKS.length,
    icon: ListTodo,
    color: "text-primary",
    bg: "bg-primary/10",
    tip: "All tasks across the project",
  },
  {
    label: "In Progress",
    value: TASKS.filter((t) => t.status === "in-progress").length,
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    tip: "Tasks currently being worked on",
  },
  {
    label: "Completed",
    value: TASKS.filter((t) => t.status === "done").length,
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    tip: "Tasks marked as done",
  },
  {
    label: "Critical",
    value: TASKS.filter((t) => t.priority === "critical").length,
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    tip: "Tasks with critical priority",
  },
];

const completedCount = TASKS.filter((t) => t.status === "done").length;
const progressPercent = Math.round((completedCount / TASKS.length) * 100);

export function StatsCards() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tooltip.Provider delay={200}>
          {stats.map((s) => (
            <Tooltip.Root key={s.label}>
              <Tooltip.Trigger>
                <Card.Root className="cursor-default">
                  <Card.Content className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs">{s.label}</p>
                        <p className="mt-1 font-semibold text-2xl">{s.value}</p>
                      </div>
                      <div className={`flex size-9 items-center justify-center rounded-lg ${s.bg}`}>
                        <s.icon className={`size-4 ${s.color}`} />
                      </div>
                    </div>
                  </Card.Content>
                </Card.Root>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <Tooltip.Arrow />
                    {s.tip}
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Tooltip.Provider>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Progress.Root value={progressPercent} max={100}>
            <Progress.Track>
              <Progress.Indicator />
            </Progress.Track>
          </Progress.Root>
        </div>
        <span className="shrink-0 text-muted-foreground text-xs">{progressPercent}% complete</span>
      </div>
    </div>
  );
}
