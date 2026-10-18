import { render } from "@testing-library/react";
import { type CSSProperties, Profiler } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resizeBatches } from "../../lib/shared-resize";
import {
  beforePaint,
  beforePaintOnceResized,
  eachPaintedFrame,
  emulateReducedMotion,
  enterMotionPath,
  expectFollowsFromFirstFrame,
  MOTION_PATHS,
  offBy,
  untilChanged,
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
  /** Tab "b" is disabled */
  disabled?: boolean;
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
  disabled,
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
        <Tabs.Tab value="b" className={tabClassName} disabled={disabled}>
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
  await expect.poll(() => indicator.classList.contains("top-(--active-tab-top)")).toBe(!withMotion);
  const tab = (name: "Alpha" | "Beta") => result.getByRole("tab", { name });
  const active = activeTab(layout);
  await waitForStable(() => offBy(tab(active), indicator));
  expect(offBy(tab(active), indicator)).toBeLessThanOrEqual(1);
  return { ...result, indicator, tab, list: result.getByRole("tablist") };
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

/**
 * Renders `before`, changes it to `after`, and asserts the indicator is over the active tab in
 * every frame from the one the change paints in. That frame is read after the tabs'
 * ResizeObservers, before it paints: once a box resizes, or for a move, which resizes nothing,
 * in the next frame.
 */
async function expectFollowsBeforePaint(
  withMotion: boolean,
  change: "resize" | "move",
  before: Layout,
  after: Layout,
) {
  const { indicator, tab, list, rerender } = await renderTabs(withMotion, before);
  const active = activeTab(after);
  const start = boxOf(indicator);
  const read = () => ({ indicator: boxOf(indicator), off: offBy(tab(active), indicator) });
  const firstFrame =
    change === "resize"
      ? beforePaintOnceResized({ items: [tab("Alpha"), tab("Beta")], container: list }, read)
      : beforePaint(list, read);

  rerender(tabs(after));
  await expectFollowsFromFirstFrame(firstFrame, read, start, near);
}

describe.each(MOTION_PATHS)("Tabs.Indicator, $path", ({ withMotion }) => {
  it.each(RESIZES)(
    "follows a change to %s in the frame it changes in, with no frames in between",
    (_, before, after) => expectFollowsBeforePaint(withMotion, "resize", before, after),
  );

  it.each(MOVES)(
    "follows a change to %s in the frame it changes in, which moves the tab without resizing anything",
    (_, before, after) => expectFollowsBeforePaint(withMotion, "move", before, after),
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

// A controlled root keeps a tab selected when it becomes disabled, and the tab fades to 50%. The
// indicator fades with it, frame for frame; with reduced motion both change at once.
describe("Tabs.Indicator under the selected tab disabled at runtime", () => {
  const opacityOf = (el: Element) => Number(getComputedStyle(el).opacity);

  afterEach(() => emulateReducedMotion(false));

  it.each([
    ...MOTION_PATHS.map(({ path, withMotion }) => ({ path, withMotion, reduced: false })),
    { path: "reduced motion", withMotion: false, reduced: true },
  ])("dims the indicator with the tab, on $path", async ({ withMotion, reduced }) => {
    await emulateReducedMotion(reduced);
    const { rerender, indicator, tab } = await renderTabs(withMotion, { value: "b" });
    const beta = tab("Beta");

    rerender(tabs({ value: "b", disabled: true }));
    const frames = await eachPaintedFrame(
      () => ({ tab: opacityOf(beta), indicator: opacityOf(indicator) }),
      40,
    );
    const log = JSON.stringify(frames);
    expect(
      frames.every((frame) => Math.abs(frame.indicator - frame.tab) < 0.01),
      log,
    ).toBe(true);
    // Values between the two ends: it faded rather than jumped, unless reduced motion is on
    const between = frames.filter(({ indicator: opacity }) => opacity > 0.5 && opacity < 1);
    expect(between.length > 0, log).toBe(!reduced);
    expect(await waitForStable(() => opacityOf(indicator))).toBe(0.5);
  });

  // The tab snaps because `.micro-interactions` is `transition: none !important` under reduced
  // motion. Motion drives the indicator without that class, so its `motion-reduce:transition-none`
  // has to snap it too, or it fades on until Motion hands it back.
  it("snaps the indicator to 50% with the tab when reduced motion turns on mid-fade", async () => {
    const { rerender, indicator, tab } = await renderTabs(true, { value: "b" });
    const beta = tab("Beta");

    // 10s outlasts SETTLE_TIMEOUT_MS, the wait for the preference to land
    rerender(tabs({ value: "b", disabled: true, listClassName: "[&>*]:duration-[10s]" }));
    // Every painted frame from here on. The frames that show a missing class come before
    // `emulateReducedMotion` resolves, so a read after it would miss them.
    const sampled = eachPaintedFrame(
      () => ({ tab: opacityOf(beta), indicator: opacityOf(indicator) }),
      40,
    );
    await untilChanged(() => opacityOf(beta));
    await emulateReducedMotion(true);
    const frames = await sampled;
    const log = JSON.stringify(frames);
    expect(
      frames.every((frame) => Math.abs(frame.indicator - frame.tab) < 0.01),
      log,
    ).toBe(true);
    // The preference landed within the sampled frames: nothing else ends a fade of 10s
    expect(
      frames.some((frame) => frame.tab === 0.5),
      log,
    ).toBe(true);
  });
});
