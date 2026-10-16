import { render } from "@testing-library/react";
import { type CSSProperties, Profiler } from "react";
import { describe, expect, it, vi } from "vitest";
import { resizeBatches } from "../../lib/shared-resize";
import {
  eachPaintedFrame,
  enterMotionPath,
  expectJumpedAtOnce,
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
  /**
   * Style of the list, e.g. its padding; by default it fills the box's width and fits its tabs'
   * height
   */
  listStyle?: CSSProperties;
  /** Classes of the list, besides `justify-center` */
  listClassName?: string;
  /** Width of the box around the list, which centres its tabs */
  width?: number;
  /** Classes of tab "b" */
  tabClassName?: string;
  /** Content inside tab "a": an empty span of fixed size, e.g. an animated badge */
  badge?: boolean;
};

const tabs = ({
  value = "a",
  tabStyle,
  tabKey,
  listStyle,
  listClassName,
  width = 400,
  tabClassName,
  badge,
}: Layout = {}) => (
  <div style={{ width }}>
    <Tabs.Root value={value}>
      <Tabs.List className={`justify-center ${listClassName ?? ""}`} style={listStyle}>
        {/* No transition of its own, so the tab takes its new size at once */}
        <Tabs.Tab key={tabKey} value="a" style={{ transition: "none", ...tabStyle }}>
          Alpha
          {badge && <span data-testid="badge" style={{ display: "inline-block", width: 4 }} />}
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
 * Reads `read` in the first frame in which a followed box (the tabs' border boxes, the list's
 * border and content boxes) changes size. It reads after the component's ResizeObservers and
 * before paint, as these observers are created after theirs. A first notification that reports
 * no change is skipped.
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
  // List padding: the border box grows and the content box shrinks.
  ["the padding of the list", {}, { listStyle: { padding: 16 } }],
  // Top padding: only the list's border box changes.
  ["the top padding of the list", {}, { listStyle: { paddingTop: 16 } }],
  // Only the list's content box changes, and the centred tabs move within it
  [
    "the start padding of a list of fixed size",
    FIXED,
    { listStyle: { ...FIXED.listStyle, paddingLeft: 40 } },
  ],
  ["the width of the box around the list", {}, { width: 300 }],
];

/**
 * Each move: its name, the layout before it, and the layout after it. Nothing resizes: a class
 * or inline style change on the list or a tab moves the tabs within the list's fixed size.
 */
const MOVES: [string, Layout, Layout][] = [
  [
    "the gap of a list of fixed size, by its style",
    FIXED,
    { ...FIXED, listStyle: { ...FIXED.listStyle, gap: 24 } },
  ],
  ["the gap of a list of fixed size, by its class", FIXED, { ...FIXED, listClassName: "gap-6" }],
  ["the order of the tab, by its style", FIXED, { ...FIXED, tabStyle: { order: 1 } }],
  ["the order of the other tab, by its class", FIXED, { ...FIXED, tabClassName: "order-first" }],
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
      // Over the tab in the frame the tab or the list changes in: the tabs' ResizeObservers
      // measure the tab there, and the indicator is rendered before that frame paints
      expect(await firstPaint, JSON.stringify(frames)).toBeLessThanOrEqual(1);
      expectJumpedAtOnce(frames, start, near);
    },
  );

  it.each(MOVES)(
    "follows a change to %s at once, which moves the tab without resizing anything",
    async (_, before, after) => {
      const { indicator, tab, rerender } = await renderTabs(withMotion, before);
      const start = boxOf(indicator);

      rerender(tabs(after));
      const frames = await eachPaintedFrame(
        () => ({ indicator: boxOf(indicator), off: offBy(tab("Alpha"), indicator) }),
        20,
      );
      expectJumpedAtOnce(frames, start, near);
    },
  );

  // A selection measures again once, for padding the newly active tab gains on selection, and so
  // does a move. The indicator's own writes (its box; with Motion, a spring's many frames of
  // them) never do.
  it("measures again once on a selection or a move, and never for the indicator's own writes", async () => {
    const { indicator, tab, rerender } = await renderTabs(withMotion, FIXED);
    let batches = resizeBatches.count;
    rerender(tabs({ ...FIXED, value: "b" }));
    await waitForStable(() => offBy(tab("Beta"), indicator));
    expect(resizeBatches.count).toBe(batches + 1);

    batches = resizeBatches.count;
    rerender(tabs({ ...FIXED, value: "b", listStyle: { ...FIXED.listStyle, gap: 24 } }));
    await waitForStable(() => offBy(tab("Beta"), indicator));
    expect(offBy(tab("Beta"), indicator)).toBeLessThanOrEqual(1);
    expect(resizeBatches.count).toBe(batches + 1);
  });

  // A write inside a tab can only move the tabs by resizing that tab, which the tabs' border-box
  // observers catch. A Motion-animated badge writes style every frame and must not cost a render.
  it("does not measure again for a style change inside a tab", async () => {
    const { getByTestId } = await renderTabs(withMotion, { ...FIXED, badge: true });
    const badge = getByTestId("badge");
    const batches = resizeBatches.count;
    for (const opacity of ["0.2", "0.4", "0.6", "0.8"]) {
      badge.style.opacity = opacity;
      await eachPaintedFrame(() => 0, 2);
    }
    expect(resizeBatches.count).toBe(batches);
  });

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

  // Every indicator on the page shares one ResizeObserver, whose callback commits every notified
  // indicator's measure in one synchronous render: a resize that reaches every list costs one
  // render per frame, not one per list
  it("commits every list on the page once when the padding of their tabs changes", async () => {
    await enterMotionPath(withMotion);
    const onRender = vi.fn();
    const lists = (paddingInline?: number) => (
      <Profiler id="lists" onRender={onRender}>
        {["one", "two", "three"].map((name) => (
          <Tabs.Root key={name} value="a">
            {/* Only the tabs' border boxes change: the lists keep their size */}
            <Tabs.List className="justify-center" style={FIXED.listStyle}>
              <Tabs.Tab value="a" style={{ transition: "none", paddingInline }}>
                Alpha
              </Tabs.Tab>
              <Tabs.Tab value="b" style={{ transition: "none", paddingInline }}>
                Beta
              </Tabs.Tab>
              <Tabs.Indicator data-testid="indicator" />
            </Tabs.List>
          </Tabs.Root>
        ))}
      </Profiler>
    );
    const { rerender, getAllByRole } = render(lists());
    /** How far each list's indicator is off its active tab */
    const offsets = () =>
      getAllByRole("tablist").map((list) => {
        const indicator = list.querySelector('[data-testid="indicator"]');
        const active = list.querySelector('[aria-selected="true"]');
        return indicator && active ? offBy(active, indicator) : null;
      });
    await waitForStable(offsets);
    expect(offsets().every((off) => off !== null && off <= 1)).toBe(true);

    rerender(lists(24));
    // The render above committed in act(); what follows comes from the ResizeObserver
    onRender.mockClear();
    await waitForStable(offsets);
    expect(offsets().every((off) => off !== null && off <= 1)).toBe(true);
    expect(onRender).toHaveBeenCalledTimes(1);
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
