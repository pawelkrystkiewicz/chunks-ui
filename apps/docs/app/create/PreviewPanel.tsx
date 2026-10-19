"use client";

import { ToggleGroup } from "chunks-ui";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { memo, useRef, useState } from "react";
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
import { ThemeStatus } from "./ThemeStatus";
import { previewColumnWidth, type Theme } from "./theme-model";

// Width only: media queries inside the preview still follow the real window.
const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%", Icon: Monitor },
  { id: "tablet", label: "Tablet", width: "768px", Icon: Tablet },
  { id: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
] as const;

type ViewportId = (typeof VIEWPORTS)[number]["id"];

export function PreviewPanel({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (patch: Partial<Theme>) => void;
}) {
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const columns = useRef<HTMLDivElement>(null);
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
      data-pagefind-ignore
      // --lit keeps the page's primary for the outlines: the preview scope sets its own
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-background shadow-[0_1px_2px_oklch(0_0_0/0.04)] [--lit:var(--primary)]"
    >
      <div className="flex h-[50px] items-center justify-between gap-4 border-border border-b pe-2.5 ps-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-semibold text-[13px]">Preview</span>
          <span className="truncate font-mono text-[11.5px] text-muted-foreground">{summary}</span>
        </div>
        <ToggleGroup.Root
          aria-label="Preview width"
          value={[viewport]}
          onValueChange={(v) => v[0] && setViewport(v[0])}
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

      <ThemeStatus theme={theme} onChange={onChange} preview={columns} />

      <ThemeScope
        theme={theme}
        className="min-h-[calc(100vh-200px)] bg-(--canvas) p-[28px] leading-[1.45] transition-[background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
      >
        {/* will-change: opacity composites the columns to work around WebKit W80 (#341,
            https://bugs.webkit.org/show_bug.cgi?id=327820): a composited element in a later
            column paints under column 1, below the grid. Not transform, which would make the
            columns the containing block of Base UI's fixed hidden inputs. Keep every descendant
            off its own layer (no will-change, translateZ(0) or translate3d): a composited
            descendant in a later column is misplaced, workaround or not.
            Remove once the Safari versions we support ship the fix (the W80 bug spec in
            Smoke.webkit.visual.spec.tsx fails first). Details: TESTING_STRATEGY.md, WebKit
            Smoke Tests. */}
        {/* data-lit: the elements that paint with the colour being edited (ThemeStatus) */}
        <div
          ref={columns}
          style={{
            maxWidth: VIEWPORTS.find((vp) => vp.id === viewport)?.width,
            columnWidth: previewColumnWidth(theme),
          }}
          className="mx-auto gap-5 transition-[max-width] duration-400 ease-fluid will-change-[opacity] motion-reduce:transition-none [&_[data-lit]]:outline-offset-2 [&_[data-lit]]:[outline:2px_dashed_var(--lit)]"
        >
          <PreviewCards fontHeading={theme.fontHeading} fontBody={theme.fontBody} />
        </div>
      </ThemeScope>
    </section>
  );
}

/**
 * The cards read the theme through the scope's CSS variables, so only a font
 * change (shown by name in TypographyCard) has to re-render them. Without memo,
 * every knob change re-rendered all 15 cards and their 5 mounted overlays.
 */
const PreviewCards = memo(function PreviewCards({
  fontHeading,
  fontBody,
}: Pick<Theme, "fontHeading" | "fontBody">) {
  return (
    <>
      <UsersCard />
      <NewProjectCard />
      <TypographyCard fontHeading={fontHeading} fontBody={fontBody} />
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
    </>
  );
});
