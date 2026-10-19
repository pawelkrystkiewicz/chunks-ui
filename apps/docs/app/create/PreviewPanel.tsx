"use client";

import { Tabs, ToggleGroup } from "chunks-ui";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { memo, useEffect, useRef, useState } from "react";
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

// Loaded when its tab is first opened, so /create's first load does not carry it. The fallback
// holds some height, so the canvas jumps less. ponytail: a failed chunk load (a tab left open
// across a deploy) falls to Next's root error boundary.
const KitchenSink = dynamic(() => import("../kitchen-sink").then((m) => m.KitchenSink), {
  loading: () => (
    <div role="status" className="min-h-[60vh] py-8 text-muted-foreground text-sm">
      Loading the kitchen sink…
    </div>
  ),
});

type PreviewId = "cards" | "kitchen-sink";

/** `?preview=kitchen-sink` in the URL selects the kitchen sink; anything else, the cards */
const PREVIEW_PARAM = "preview";

/**
 * Sets the tab from the URL on mount and on every search-param change: Next keeps the page's state
 * on a soft navigation within /create (a link to ?preview=kitchen-sink), so reading once would
 * miss it. Rendered after mount only, as useSearchParams in the prerender needs a Suspense
 * boundary. It reads window.location, as useSearchParams is null outside the app router (jsdom).
 */
function UrlPreview({ onRead }: { onRead: (id: PreviewId) => void }) {
  const params = useSearchParams();
  // biome-ignore lint/correctness/useExhaustiveDependencies: params only re-runs the read
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
    onRead(id === "kitchen-sink" ? "kitchen-sink" : "cards");
  }, [params, onRead]);
  return null;
}

export function PreviewPanel({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (patch: Partial<Theme>) => void;
}) {
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const content = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewId>("cards");
  const [textSpacing, setTextSpacing] = useState(false);

  // After mount, like the theme: the page is server-rendered. ponytail: a direct
  // /create?preview=kitchen-sink load (the redirect's target) hydrates the Cards panel first, then
  // swaps it for the loading fallback and the lazy chunk. Accepted: the page is static.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectPreview = (next: PreviewId) => {
    setPreview(next);
    // Not a navigation: the tab is shareable, but Back should not step through tab switches
    const url = new URL(window.location.href);
    if (next === "cards") url.searchParams.delete(PREVIEW_PARAM);
    else url.searchParams.set(PREVIEW_PARAM, next);
    // null state: Next's own state carries a flag that makes its patched replaceState skip the sync
    window.history.replaceState(null, "", url);
  };

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
      {mounted && <UrlPreview onRead={setPreview} />}
      <Tabs.Root
        value={preview}
        onValueChange={(v) => selectPreview(v as PreviewId)}
        className="flex flex-col"
      >
        <div className="grid h-[50px] grid-cols-[1fr_auto_1fr] items-center gap-3 border-border border-b pe-2.5 ps-[18px]">
          <div className="flex min-w-0 items-center gap-3">
            {/* Hidden on a phone, where the tabs and the toggle need the row: the section is named Preview */}
            <span className="font-semibold text-[13px] max-[440px]:hidden">Preview</span>
            <span className="truncate font-mono text-[11.5px] text-muted-foreground">
              {summary}
            </span>
          </div>
          <Tabs.List
            aria-label="Preview content"
            className="gap-0 rounded-[9px] bg-secondary p-[3px]"
          >
            <Tabs.Tab value="cards" className="h-[26px] px-2 py-0 text-xs sm:px-3">
              Cards
            </Tabs.Tab>
            <Tabs.Tab value="kitchen-sink" className="h-[26px] px-2 py-0 text-xs sm:px-3">
              Kitchen sink
            </Tabs.Tab>
            <Tabs.Indicator />
          </Tabs.List>
          <ToggleGroup.Root
            aria-label="Preview width"
            value={[viewport]}
            onValueChange={(v) => v[0] && setViewport(v[0])}
            className="justify-self-end rounded-[9px] bg-secondary p-[3px]"
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

        <ThemeStatus
          theme={theme}
          onChange={onChange}
          preview={content}
          textSpacing={textSpacing}
          onTextSpacingChange={setTextSpacing}
        />

        <ThemeScope
          theme={theme}
          textSpacing={textSpacing}
          className="min-h-[calc(100vh-200px)] bg-(--canvas) p-[28px] leading-[1.45] transition-[background] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        >
          {/* data-lit: the elements that paint with the colour being edited (ThemeStatus) */}
          <div
            ref={content}
            style={{ maxWidth: VIEWPORTS.find((vp) => vp.id === viewport)?.width }}
            className="mx-auto transition-[max-width] duration-400 ease-fluid motion-reduce:transition-none [&_[data-lit]]:outline-offset-2 [&_[data-lit]]:[outline:2px_dashed_var(--lit)]"
          >
            <Tabs.Panel value="cards">
              {/* will-change: opacity composites the columns to work around WebKit W80 (#341,
                  https://bugs.webkit.org/show_bug.cgi?id=327820): a composited element in a later
                  column paints under column 1, below the grid. Not transform, which would make the
                  columns the containing block of Base UI's fixed hidden inputs. Keep every
                  descendant off its own layer (no will-change, translateZ(0) or translate3d): a
                  composited descendant in a later column is misplaced, workaround or not.
                  Remove once the Safari versions we support ship the fix (the W80 bug spec in
                  Smoke.webkit.visual.spec.tsx fails first). Details: TESTING_STRATEGY.md, WebKit
                  Smoke Tests. */}
              <div
                style={{ columnWidth: previewColumnWidth(theme) }}
                className="gap-5 will-change-[opacity]"
              >
                <PreviewCards fontHeading={theme.fontHeading} fontBody={theme.fontBody} />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="kitchen-sink">
              <KitchenSink />
            </Tabs.Panel>
          </div>
        </ThemeScope>
      </Tabs.Root>
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
