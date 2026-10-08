"use client";

import { ToggleGroup } from "chunks-ui";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { AlertsCard } from "./preview/AlertsCard";
import { ButtonsCard } from "./preview/ButtonsCard";
import { CalendarCard } from "./preview/CalendarCard";
import { CommandCard } from "./preview/CommandCard";
import { EmptyCard } from "./preview/EmptyCard";
import { NewProjectCard } from "./preview/NewProjectCard";
import { NotificationsCard } from "./preview/NotificationsCard";
import { PlanCard } from "./preview/PlanCard";
import { SignInCard } from "./preview/SignInCard";
import { TabsCard } from "./preview/TabsCard";
import { TeamCard } from "./preview/TeamCard";
import { TypographyCard } from "./preview/TypographyCard";
import { UsageCard } from "./preview/UsageCard";
import { UsersCard } from "./preview/UsersCard";
import { VelocityCard } from "./preview/VelocityCard";
import { ThemeScope } from "./ThemeScope";
import type { Theme } from "./theme-model";

// Width only: media queries inside the preview still follow the real window.
const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%", Icon: Monitor },
  { id: "tablet", label: "Tablet", width: "768px", Icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
];

export function PreviewPanel({ theme }: { theme: Theme }) {
  const [viewport, setViewport] = useState("desktop");
  const summary = [
    theme.fontHeading === theme.fontBody
      ? theme.fontHeading
      : `${theme.fontHeading} / ${theme.fontBody}`,
    `${theme.fontSize}px`,
    `r${theme.radius}`,
    `h${theme.height}`,
    theme.mode,
  ].join(" · ");

  return (
    <section
      aria-label="Preview"
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-background shadow-[0_1px_2px_oklch(0_0_0/0.04)]"
    >
      <div className="flex h-[50px] items-center justify-between gap-4 border-border border-b pr-2.5 pl-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-semibold text-[13px]">Preview</span>
          <span className="truncate font-mono text-[11.5px] text-muted-foreground">{summary}</span>
        </div>
        <ToggleGroup.Root
          aria-label="Preview width"
          value={[viewport]}
          onValueChange={(v) => v[0] && setViewport(String(v[0]))}
          className="rounded-[9px] bg-secondary p-[3px]"
        >
          {VIEWPORTS.map(({ id, label, Icon }) => (
            <ToggleGroup.Item
              key={id}
              value={id}
              aria-label={label}
              title={label}
              className="h-[26px] w-8 p-0 text-foreground"
            >
              <Icon className="size-[15px]" />
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      <ThemeScope
        theme={theme}
        className="min-h-[calc(100vh-200px)] bg-(--canvas) p-[28px] leading-[1.45] transition-[background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
      >
        <div
          style={{ maxWidth: VIEWPORTS.find((vp) => vp.id === viewport)?.width }}
          className="mx-auto columns-[290px] gap-5 transition-[max-width] duration-400 ease-fluid motion-reduce:transition-none"
        >
          <UsersCard />
          <NewProjectCard />
          <TypographyCard fontHeading={theme.fontHeading} fontBody={theme.fontBody} />
          <ButtonsCard />
          <PlanCard />
          <CalendarCard />
          <TeamCard />
          <AlertsCard />
          <VelocityCard />
          <SignInCard />
          <NotificationsCard />
          <TabsCard />
          <CommandCard />
          <UsageCard />
          <EmptyCard />
        </div>
      </ThemeScope>
    </section>
  );
}
