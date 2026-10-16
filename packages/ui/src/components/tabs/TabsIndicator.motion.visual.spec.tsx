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
  /** Key of tab "a": a new key remounts it */
  tabKey?: string;
  /** Style of the list, as a spacing slider would set its padding; by default it fills the box's width and fits its tabs' height */
  listStyle?: CSSProperties;
  /** Width of the box around the list, which centres its tabs */
  width?: number;
  /** Classes of tab "b" */
  tabClassName?: string;
};

const tabs = ({
  value = "a",
  tabStyle,
  tabKey,
  listStyle,
  width = 400,
  tabClassName,
}: Layout = {}) => (
  <div style={{ width }}>
    <Tabs.Root value={value}>
      <Tabs.List className="justify-center" style={listStyle}>
        {/* No transition of its own, so the tab takes its new size at once */}
        <Tabs.Tab key={tabKey} value="a" style={{ transition: "none", ...tabStyle }}>
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

/** The name of the active tab of `layout` */
const activeTab = (layout?: Layout) => (layout?.value === "b" ? "Beta" : "Alpha");

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
  const active = activeTab(layout);
  await waitForStable(() => offBy(tab(active), indicator));
  expect(offBy(tab(active), indicator)).toBeLessThanOrEqual(1);
  return { ...result, indicator, tab, list: result.getByRole("tablist") };
}

type BoxSize = { inlineSize: number; blockSize: number };

/** The content box of `el`, as a ResizeObserver reports it: its border box less padding and border */
function contentBoxOf(el: Element): BoxSize {
  const { width, height } = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const sum = (...lengths: string[]) =>
    lengths.reduce((total, length) => total + Number.parseFloat(length), 0);
  return {
    inlineSize:
      width -
      sum(style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth),
    blockSize:
      height -
      sum(style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth),
  };
}

const sameSize = (a: BoxSize | undefined, b: BoxSize) =>
  a?.inlineSize === b.inlineSize && a.blockSize === b.blockSize;

/**
 * Reads `read` in the first frame in which one of the boxes the indicator follows (the tabs'
 * border boxes, and the list's border and content boxes) differs from its size now, after the tabs' ResizeObservers and
 * before that frame paints: an observer created after the tabs' gets its callback after theirs,
 * in the same frame. A new observer is also notified in its first frame when nothing changed;
 * that notification is skipped.
 */
function beforePaintOnceResized<T>(
  { tabs, list }: { tabs: Element[]; list: Element },
  read: () => T,
) {
  const borderBoxes = new Map(
    tabs.map((tab) => {
      const { width, height } = tab.getBoundingClientRect();
      return [tab, { inlineSize: width, blockSize: height }];
    }),
  );
  const listContentBox = contentBoxOf(list);
  const { width, height } = list.getBoundingClientRect();
  const listBorderBox = { inlineSize: width, blockSize: height };
  return new Promise<T>((resolve) => {
    // One observer can't observe an element twice: the list's content box has its own
    const onResize = (entries: ResizeObserverEntry[]) => {
      const changed = entries.some(({ target, borderBoxSize, contentBoxSize }) =>
        target === list
          ? !sameSize(contentBoxSize[0], listContentBox) ||
            !sameSize(borderBoxSize[0], listBorderBox)
          : !sameSize(borderBoxSize[0], borderBoxes.get(target) ?? { inlineSize: 0, blockSize: 0 }),
      );
      if (!changed) return;
      observer.disconnect();
      listObserver.disconnect();
      resolve(read());
    };
    const observer = new ResizeObserver(onResize);
    const listObserver = new ResizeObserver(onResize);
    for (const tab of tabs) observer.observe(tab, { box: "border-box" });
    observer.observe(list, { box: "content-box" });
    listObserver.observe(list, { box: "border-box" });
  });
}

/** A list that keeps its size whatever its tabs do; `justify-center` centres them in it */
const FIXED: Layout = { listStyle: { width: 360, height: 48 } };

/** Each resize: its name, the layout before it, and the layout after it */
const RESIZES: [string, Layout, Layout][] = [
  ["the font size of the tab", {}, { tabStyle: { fontSize: 20 } }],
  // Only the tab's border box grows: its content box doesn't, nor does the list's
  ["the padding of the tab", {}, { tabStyle: { paddingInline: 24 } }],
  // Only that tab's border box grows: the active tab moves in the centred list, at its size
  [
    "the padding of a tab before the active one",
    { value: "b" },
    { value: "b", tabStyle: { paddingInline: 24 } },
  ],
  // No tab changes size: the list's border box grows and its content box shrinks
  ["the padding of the list", {}, { listStyle: { padding: 16 } }],
  // Only the list's border box changes: it has auto height and full width, and the tabs keep
  // their sizes and the list's content box
  ["the top padding of the list", {}, { listStyle: { paddingTop: 16 } }],
  // Only the list's content box changes, and the centred tabs move within it
  [
    "the start padding of a list of fixed size",
    FIXED,
    { listStyle: { ...FIXED.listStyle, paddingLeft: 40 } },
  ],
  ["the width of the box around the list", {}, { width: 300 }],
];

describe.each(MOTION_PATHS)("Tabs.Indicator, $path", ({ withMotion }) => {
  it.each(RESIZES)(
    "follows a change to %s in the frame it changes in, with no frames in between",
    async (_, before, after) => {
      const { indicator, tab, list, rerender } = await renderTabs(withMotion, before);
      const active = activeTab(after);
      const start = boxOf(indicator);
      const firstPaint = beforePaintOnceResized({ tabs: [tab("Alpha"), tab("Beta")], list }, () =>
        offBy(tab(active), indicator),
      );

      rerender(tabs(after));
      const frames = await eachPaintedFrame(
        () => ({ indicator: boxOf(indicator), off: offBy(tab(active), indicator) }),
        20,
      );
      const end = frames.at(-1)?.indicator ?? start;
      const log = JSON.stringify(frames);
      expect(near(start, end), log).toBe(false);
      // Over the tab in the frame the tab or the list changes in: the tabs' ResizeObservers
      // measure the tab there, and the indicator is rendered before that frame paints
      expect(await firstPaint, log).toBeLessThanOrEqual(1);
      expect(frames.at(-1)?.off, log).toBeLessThanOrEqual(1);
      // Each frame shows the indicator where it was or where it goes, never between
      expect(
        frames.every((frame) => near(frame.indicator, start) || near(frame.indicator, end)),
        log,
      ).toBe(true);
      // The first frame is read before the ResizeObservers measure the tab: it may show the old
      // box, and no more
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
  // the indicator with the tab's new size, in the frame that observes the growth, before it paints.
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
  // that adds data-active, and its own observer watches the content box, so only the observation
  // made after that commit (a re-observe on the aria-selected change) measures the grown tab.
  it("ends on a tab that grows by padding when it is selected", async () => {
    const layout = { tabClassName: "data-active:px-8" };
    const { indicator, tab, rerender } = await renderTabs(withMotion, layout);
    const beta = tab("Beta");

    rerender(tabs({ ...layout, value: "b" }));
    await waitForStable(() => offBy(beta, indicator));
    expect(offBy(beta, indicator)).toBeLessThanOrEqual(1);
  });

  // The tab gains its padding on selection; nothing resizes between the two commits.
  it("ends on a padded tab selected again before a frame", async () => {
    const layout = { tabClassName: "data-active:px-8", value: "b" as const };
    const { indicator, tab, rerender } = await renderTabs(withMotion, layout);
    rerender(tabs({ ...layout, value: "a" }));
    rerender(tabs(layout));
    await waitForStable(() => offBy(tab("Beta"), indicator));
    expect(offBy(tab("Beta"), indicator)).toBeLessThanOrEqual(1);
  });

  // A new key remounts the active tab; the value stays the same.
  it("follows a padding change of the active tab after it remounts", async () => {
    const { indicator, tab, rerender } = await renderTabs(withMotion);
    const mounted = tab("Alpha");

    rerender(tabs({ tabKey: "remounted" }));
    expect(tab("Alpha")).not.toBe(mounted);
    await waitForStable(() => offBy(tab("Alpha"), indicator));
    expect(offBy(tab("Alpha"), indicator)).toBeLessThanOrEqual(1);

    rerender(tabs({ tabKey: "remounted", tabStyle: { paddingInline: 24 } }));
    await waitForStable(() => offBy(tab("Alpha"), indicator));
    expect(offBy(tab("Alpha"), indicator)).toBeLessThanOrEqual(1);
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
