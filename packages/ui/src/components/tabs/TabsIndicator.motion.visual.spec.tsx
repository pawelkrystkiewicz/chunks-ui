import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import {
  eachPaintedFrame,
  enterMotionPath,
  MOTION_PATHS,
  offBy,
  SETTLE_TIMEOUT_MS,
  waitForStable,
} from "../../VisualTest.utils";
import { Tabs } from "./index";

// Runs with reduced motion off: Motion springs the indicator, or without Motion the CSS
// fallback slides it with a transition

type Layout = {
  value?: "a" | "b";
  /** Style of tab "a", as a font size slider would set it */
  tabStyle?: CSSProperties;
  /** Padding of the list, as a spacing slider would set it */
  listPadding?: number;
  /** Width of the box around the list, which centres its tabs */
  width?: number;
  /** Classes of tab "b" */
  tabClassName?: string;
};

const tabs = ({ value = "a", tabStyle, listPadding, width = 400, tabClassName }: Layout = {}) => (
  <div style={{ width }}>
    <Tabs.Root value={value}>
      <Tabs.List className="justify-center" style={{ padding: listPadding }}>
        {/* No transition of its own, so the tab takes its new size at once */}
        <Tabs.Tab value="a" style={{ transition: "none", ...tabStyle }}>
          Alpha
        </Tabs.Tab>
        <Tabs.Tab value="b" className={tabClassName}>
          Beta
        </Tabs.Tab>
        <Tabs.Indicator data-testid="indicator" />
      </Tabs.List>
    </Tabs.Root>
  </div>
);

const boxOf = (el: Element) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { left, top, width, height };
};
type Box = ReturnType<typeof boxOf>;

const near = (a: Box, b: Box) =>
  (["left", "top", "width", "height"] as const).every((edge) => Math.abs(a[edge] - b[edge]) <= 1);

async function renderTabs(withMotion: boolean, layout?: Layout) {
  await enterMotionPath(withMotion);
  const result = render(tabs(layout));
  const indicator = result.getByTestId("indicator");
  // Motion drops the CSS fallback's position classes, which read Base UI's variables, once it
  // drives the indicator
  await expect
    .poll(() => indicator.classList.contains("top-(--active-tab-top)"), { timeout: 5000 })
    .toBe(!withMotion);
  const tab = (name: "Alpha" | "Beta") => result.getByRole("tab", { name });
  await waitForStable(() => offBy(tab("Alpha"), indicator));
  expect(offBy(tab("Alpha"), indicator)).toBeLessThanOrEqual(1);
  return { ...result, indicator, tab };
}

const RESIZES: [string, Layout][] = [
  ["the font size of the tab", { tabStyle: { fontSize: 20 } }],
  // Only the tab's border box grows: its content box doesn't, nor does the list's
  ["the padding of the tab", { tabStyle: { paddingInline: 24 } }],
  ["the padding of the list", { listPadding: 16 }],
  ["the width of the box around the list", { width: 300 }],
];

describe.each(MOTION_PATHS)("Tabs.Indicator, $path", ({ withMotion }) => {
  it.each(RESIZES)(
    "follows a change to %s at once, with no frames in between",
    async (_, resized) => {
      const { indicator, tab, rerender } = await renderTabs(withMotion);
      const start = boxOf(indicator);

      rerender(tabs(resized));
      const frames = await eachPaintedFrame(
        () => ({ indicator: boxOf(indicator), off: offBy(tab("Alpha"), indicator) }),
        20,
      );
      const end = frames.at(-1)?.indicator ?? start;
      const log = JSON.stringify(frames);
      expect(near(start, end), log).toBe(false);
      expect(frames.at(-1)?.off, log).toBeLessThanOrEqual(1);
      // Each frame shows the indicator where it was or where it goes, never between
      expect(
        frames.every((frame) => near(frame.indicator, start) || near(frame.indicator, end)),
        log,
      ).toBe(true);
      // Base UI measures the tab after a resize in a ResizeObserver, so the indicator may show
      // its old box for one frame after the tab changes, and no longer
      expect(frames.filter((frame) => frame.off > 1).length, log).toBeLessThanOrEqual(1);
    },
  );

  it("still slides to a newly selected tab", async () => {
    const { indicator, tab, rerender } = await renderTabs(withMotion);
    const start = indicator.getBoundingClientRect().left;
    rerender(tabs({ value: "b" }));
    const lefts = await eachPaintedFrame(() => indicator.getBoundingClientRect().left, 40);
    await waitForStable(() => offBy(tab("Beta"), indicator));
    const end = indicator.getBoundingClientRect().left;
    expect(offBy(tab("Beta"), indicator)).toBeLessThanOrEqual(1);
    expect(end).toBeGreaterThan(start + 1);
    // In-between frames: it slides rather than jumping
    expect(
      lefts.some((left) => left > start + 1 && left < end - 1),
      JSON.stringify(lefts),
    ).toBe(true);
  });

  // The selected tab grows once it is active, so Base UI measures it again mid-slide and renders
  // the indicator with the tab's new size, in the task after the frame that observes the growth.
  // That resize must not cut the slide short: a slide cut short jumps to the tab in the frames
  // right after that render, which this reads.
  it("still slides to a tab that grows when it is selected", async () => {
    const layout = { tabClassName: "data-active:text-xl" };
    const { indicator, tab, rerender } = await renderTabs(withMotion, layout);
    const beta = tab("Beta");
    const left = (el: Element) => el.getBoundingClientRect().left;

    rerender(tabs({ ...layout, value: "b" }));
    // Rendered from the tab's size before it grew: the render that starts the slide measures
    // the tab before the commit that makes it active
    await untilChanged(() => indicator.style.getPropertyValue("--active-tab-width"));
    const frames = await eachPaintedFrame(
      () => ({ indicator: left(indicator), beta: left(beta) }),
      2,
    );
    for (const frame of frames) {
      expect(frame.indicator, JSON.stringify(frames)).toBeLessThan(frame.beta - 1);
    }
    await waitForStable(() => offBy(beta, indicator));
    expect(offBy(beta, indicator)).toBeLessThanOrEqual(1);
  });

  // Only the tab's border box grows once it is active. Base UI measures it before the commit
  // that adds data-active, and its own observer watches the content box, so only the first
  // notification of the observer created after that commit measures the grown tab.
  it("ends on a tab that grows by padding when it is selected", async () => {
    const layout = { tabClassName: "data-active:px-8" };
    const { indicator, tab, rerender } = await renderTabs(withMotion, layout);
    const beta = tab("Beta");

    rerender(tabs({ ...layout, value: "b" }));
    await waitForStable(() => offBy(beta, indicator));
    expect(offBy(beta, indicator)).toBeLessThanOrEqual(1);
  });
});

/** Resolves in the first frame in which `read` returns something other than it returns now */
async function untilChanged(read: () => string) {
  const before = read();
  const deadline = performance.now() + SETTLE_TIMEOUT_MS;
  while (read() === before) {
    if (performance.now() > deadline) {
      throw new Error(`Still ${JSON.stringify(before)} after ${SETTLE_TIMEOUT_MS}ms`);
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}
