import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { eachPaintedFrame, insetsWithin, waitForStable } from "../../VisualTest.utils";
import { Tabs } from "./index";

// Runs with reduced motion off: Motion springs the indicator, or without Motion the CSS
// fallback slides it with a transition

const PATHS = [
  { path: "Motion", withMotion: true },
  // Motion never arrives, so the CSS fallback drives the indicator
  { path: "CSS fallback", withMotion: false },
] as const;

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

/** Loads Motion, or holds it back for good. A held-back load never settles, so it isn't awaited */
async function motion(withMotion: boolean) {
  if (withMotion) await reloadMotion();
  else void reloadMotion(new Promise(() => {}));
}

const boxOf = (el: Element) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { left, top, width, height };
};
type Box = ReturnType<typeof boxOf>;

const near = (a: Box, b: Box) =>
  (["left", "top", "width", "height"] as const).every((edge) => Math.abs(a[edge] - b[edge]) <= 1);

/** The largest distance between an edge of the indicator and the same edge of the tab */
const offBy = (tab: Element, indicator: Element) =>
  Math.max(...Object.values(insetsWithin(tab, indicator)).map(Math.abs));

async function renderTabs(withMotion: boolean, layout?: Layout) {
  await motion(withMotion);
  const result = render(tabs(layout));
  const indicator = result.getByTestId("indicator");
  // Motion drops the CSS fallback's transition class once it drives the indicator
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
  ["the padding of the list", { listPadding: 16 }],
  ["the width of the box around the list", { width: 300 }],
];

describe.each(PATHS)("Tabs.Indicator, $path", ({ withMotion }) => {
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

  /** The indicator's left edge for 40 painted frames after `value` becomes "b" */
  async function slideToBeta(layout: Layout = {}) {
    const { indicator, tab, rerender } = await renderTabs(withMotion, layout);
    const start = indicator.getBoundingClientRect().left;
    rerender(tabs({ ...layout, value: "b" }));
    const lefts = await eachPaintedFrame(() => indicator.getBoundingClientRect().left, 40);
    await waitForStable(() => offBy(tab("Beta"), indicator));
    const end = indicator.getBoundingClientRect().left;
    expect(offBy(tab("Beta"), indicator)).toBeLessThanOrEqual(1);
    expect(end).toBeGreaterThan(start + 1);
    return lefts.filter((left) => left > start + 1 && left < end - 1);
  }

  it("still slides to a newly selected tab", async () => {
    const between = await slideToBeta();
    expect(between.length).toBeGreaterThan(0);
  });

  // The selected tab grows once it is active, so Base UI measures it again mid-slide. That
  // resize must not cut the slide short by jumping to the end.
  it("still slides to a tab that grows when it is selected", async () => {
    const between = await slideToBeta({ tabClassName: "data-active:text-xl" });
    expect(between.length).toBeGreaterThanOrEqual(5);
  });
});
