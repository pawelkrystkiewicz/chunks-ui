import { render } from "@testing-library/react";
import {
  Activity,
  type CSSProperties,
  createRef,
  Profiler,
  type ReactElement,
  type RefObject,
  StrictMode,
} from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { resizeBatches } from "../../lib/shared-resize";
import { reloadMotion } from "../../lib/use-motion";
import {
  beforePaint,
  beforePaintOnceResized,
  eachPaintedFrame,
  emulateReducedMotion,
  enterMotionPath,
  expectFollowsFromFirstFrame,
  insetsWithin,
  MOTION_PATHS,
  offBy,
  untilChanged,
  waitForStable,
} from "../../VisualTest.utils";
import { ToggleGroup, type ToggleGroupRootProps } from "./index";

// Reduced motion is off, so Motion drives the indicator; the cases that turn it on or hold Motion back use the CSS fallback.
// A consumer's ref must not replace the Root's (the container) or an Item's (how the Root finds it).

type Part = "Root" | "Item";
type RefKind = "object" | "callback" | "undefined";

/** The indicator covers the item: every edge within 0.5px */
const COVERS = {
  top: expect.closeTo(0, 0),
  right: expect.closeTo(0, 0),
  bottom: expect.closeTo(0, 0),
  left: expect.closeTo(0, 0),
};

/** The indicator's insets within `item` once it has settled; null without an indicator */
const settledIndicatorOver = (group: HTMLElement, item: HTMLElement, widths?: number[]) =>
  waitForStable(() => {
    const indicator = group.querySelector<HTMLElement>(":scope > span");
    if (!indicator) return null;
    widths?.push(indicator.getBoundingClientRect().width);
    return insetsWithin(item, indicator);
  });

/**
 * A ToggleGroup with a short and a long item and a consumer ref of `kind` on the Root or on the
 * long Item. `ref` is passed even when undefined: ref={undefined} must not break the indicator
 * either. The callback ref is an inline arrow, a new function on every render, as consumers
 * usually write it.
 */
function renderWithRef(part: Part, kind: RefKind) {
  const objects = { root: createRef<HTMLDivElement>(), item: createRef<HTMLButtonElement>() };
  let calledWith: HTMLElement | null = null;
  const refFor = <T extends HTMLElement>(object: RefObject<T | null>) => {
    if (kind === "object") return object;
    if (kind === "callback") {
      return (element: T | null) => {
        calledWith = element;
      };
    }
    return undefined;
  };
  const ui = () => (
    <ToggleGroup.Root
      defaultValue={["a"]}
      {...(part === "Root" ? { ref: refFor(objects.root) } : {})}
    >
      <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
      <ToggleGroup.Item value="b" {...(part === "Item" ? { ref: refFor(objects.item) } : {})}>
        Beta, a longer item
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
  const { getByRole, rerender } = render(ui());
  const group = getByRole("group");
  return {
    group,
    alpha: getByRole("button", { name: "Alpha" }),
    beta: getByRole("button", { name: "Beta, a longer item" }),
    indicator: () => group.querySelector<HTMLElement>(":scope > span"),
    /** What the consumer's ref holds (undefined for ref={undefined}) */
    received: () => {
      if (kind === "object") return part === "Root" ? objects.root.current : objects.item.current;
      return kind === "callback" ? calledWith : undefined;
    },
    rerender: () => rerender(ui()),
  };
}

/**
 * Renders with a ref and checks: the ref gets its element, the indicator covers the selected
 * item, and after one more render (a new inline callback ref) and a click it covers the newly
 * selected one. Returns the indicator widths seen while it moved.
 */
async function expectRefAndIndicator(part: Part, kind: RefKind, path: "css" | "motion") {
  const tg = renderWithRef(part, kind);
  const expectRefHolds = () => {
    if (kind !== "undefined") expect(tg.received()).toBe(part === "Root" ? tg.group : tg.beta);
  };
  expectRefHolds();
  await expect.poll(() => tg.indicator()).not.toBeNull();
  // The CSS fallback has a transition class that Motion's path drops
  await expect
    .poll(() => tg.indicator()?.classList.contains("micro-interactions"))
    .toBe(path === "css");
  expect(await settledIndicatorOver(tg.group, tg.alpha)).toEqual(COVERS);

  tg.rerender();
  expectRefHolds();
  await userEvent.click(tg.beta);
  const widths: number[] = [];
  expect(await settledIndicatorOver(tg.group, tg.beta, widths)).toEqual(COVERS);
  return { widths, from: tg.alpha.offsetWidth, to: tg.beta.offsetWidth };
}

const KINDS = ["object", "callback", "undefined"] as const;

describe("ToggleGroup with a consumer ref, CSS path", () => {
  beforeAll(() => emulateReducedMotion(true));
  afterAll(() => emulateReducedMotion(false));

  it.each(KINDS.flatMap((kind) => [["Root", kind] as const, ["Item", kind] as const]))(
    "%s, %s ref: the ref gets the element and the indicator follows",
    async (part, kind) => {
      await expectRefAndIndicator(part, kind, "css");
    },
  );
});

// Ref merging doesn't depend on what drives the indicator: one case per part
describe("ToggleGroup with a consumer ref, Motion path", () => {
  it.each(["Root", "Item"] as const)(
    "%s, inline callback ref: Motion still moves the indicator",
    async (part) => {
      await reloadMotion();
      const { widths, from, to } = await expectRefAndIndicator(part, "callback", "motion");
      // In-between widths: Motion's spring moved it, rather than a jump
      const between = widths.filter(
        (w) => w > Math.min(from, to) + 1 && w < Math.max(from, to) - 1,
      );
      expect(between, JSON.stringify(widths)).not.toHaveLength(0);
    },
  );
});

// Base UI keeps the pressed item when onValueChange cancels; the indicator must stay with it
describe.each([
  { path: "CSS", reducedMotion: "reduce" },
  { path: "Motion", reducedMotion: "no-preference" },
] as const)("ToggleGroup onValueChange, $path path", ({ reducedMotion }) => {
  beforeAll(() => emulateReducedMotion(reducedMotion === "reduce"));
  afterAll(() => emulateReducedMotion(false));

  /** An uncontrolled group on Alpha: checks the indicator is there, then clicks Beta */
  async function clickBeta(onValueChange: ToggleGroupRootProps["onValueChange"]) {
    await reloadMotion();
    const { getByRole } = render(
      <ToggleGroup.Root defaultValue={["a"]} onValueChange={onValueChange}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const group = getByRole("group");
    const alpha = getByRole("button", { name: "Alpha" });
    const beta = getByRole("button", { name: "Beta, a longer item" });
    // The path under test drives the indicator: the CSS fallback has a class Motion's path drops
    await expect
      .poll(() => group.querySelector(":scope > span")?.classList.contains("micro-interactions"))
      .toBe(reducedMotion === "reduce");
    expect(await settledIndicatorOver(group, alpha)).toEqual(COVERS);
    await userEvent.click(beta);
    return { group, alpha, beta };
  }

  it("keeps the indicator on the pressed item when the change is cancelled", async () => {
    const { group, alpha, beta } = await clickBeta((_, details) => details.cancel());
    expect(alpha.getAttribute("aria-pressed")).toBe("true");
    expect(beta.getAttribute("aria-pressed")).toBe("false");
    expect(await settledIndicatorOver(group, alpha)).toEqual(COVERS);
  });

  it("moves the indicator when onValueChange does not cancel", async () => {
    const onValueChange = vi.fn();
    const { group, beta } = await clickBeta(onValueChange);
    expect(onValueChange).toHaveBeenCalledWith(["b"], expect.anything());
    expect(beta.getAttribute("aria-pressed")).toBe("true");
    expect(await settledIndicatorOver(group, beta)).toEqual(COVERS);
  });
});

describe("ToggleGroup.Root with a consumer render, CSS path", () => {
  beforeAll(() => emulateReducedMotion(true));
  afterAll(() => emulateReducedMotion(false));

  it.each([
    ["an element", <nav key="element" data-probe="element" />, "element"],
    [
      "a function",
      ((props, state) => (
        <nav {...props} data-probe={state.orientation} />
      )) satisfies ToggleGroupRootProps["render"],
      "horizontal",
    ],
  ] as const)(
    "renders %s, keeps the ref, and the indicator still follows",
    async (_, consumerRender, probe) => {
      const ref = createRef<HTMLDivElement>();
      const { getByRole } = render(
        <ToggleGroup.Root defaultValue={["a"]} ref={ref} render={consumerRender}>
          <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
          <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
        </ToggleGroup.Root>,
      );
      const group = getByRole("group");
      expect(group.tagName).toBe("NAV");
      expect(group.getAttribute("data-probe")).toBe(probe);
      // Base UI >=1.6 leaves aria-orientation off role="group"; guard that it doesn't come back
      // through `render`
      expect(group.hasAttribute("aria-orientation")).toBe(false);
      expect(ref.current).toBe(group);

      expect(await settledIndicatorOver(group, getByRole("button", { name: "Alpha" }))).toEqual(
        COVERS,
      );
      const beta = getByRole("button", { name: "Beta, a longer item" });
      await userEvent.click(beta);
      expect(await settledIndicatorOver(group, beta)).toEqual(COVERS);
    },
  );
});

describe("ToggleGroup indicator after the group was hidden", () => {
  /** How the group hides: display:none on a wrapper, or React's <Activity> */
  type Hide = "display:none" | "<Activity>";
  type Shown = { hidden: boolean; value: "a" | "b"; via?: Hide };

  const group = ({ hidden, value, via = "display:none" }: Shown) => {
    const root = (
      <ToggleGroup.Root value={[value]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>
    );
    if (via === "<Activity>") {
      return (
        <div>
          <Activity mode={hidden ? "hidden" : "visible"}>{root}</Activity>
        </div>
      );
    }
    return <div style={hidden ? { display: "none" } : undefined}>{root}</div>;
  };

  /**
   * Renders the group on Alpha and returns its elements. Read before it hides: Testing Library
   * doesn't find hidden elements by role. Motion loads unless `withMotion` is false: then it never
   * arrives and the CSS fallback drives the indicator.
   */
  async function renderShown(withMotion = true, via?: Hide) {
    await enterMotionPath(withMotion);
    const { rerender, getByRole } = render(group({ hidden: false, value: "a", via }));
    const root = getByRole("group");
    const items = {
      a: getByRole("button", { name: "Alpha" }),
      b: getByRole("button", { name: "Beta, a longer item" }),
    };
    const indicator = () => root.querySelector<HTMLElement>(":scope > span");
    await waitForStable(() => indicator()?.getBoundingClientRect().width ?? null);
    /**
     * The largest distance between an edge of the indicator and the same edge of `value`'s item;
     * null while no indicator shows
     */
    const offItem = (value: Shown["value"]) => {
      const shown = indicator();
      return shown?.checkVisibility() ? offBy(items[value], shown) : null;
    };
    const settled = () => waitForStable(() => indicator()?.getAttribute("style") ?? null);
    return { root, rerender, indicator, offItem, settled };
  }

  /**
   * Asserts the indicator is over the item in the frame the group shows again in, and in each
   * of the 30 painted frames after it: no frame without it, no growing from 0×0, no sliding from
   * where it was before it hid. Call it right after the render that shows the group.
   */
  async function expectOverItemFromFirstFrame(root: Element, read: () => number | null) {
    const first = await beforePaint(root, read);
    expect(first, "the frame the group shows in").not.toBeNull();
    expect(first).toBeLessThanOrEqual(1);
    const offsets = await eachPaintedFrame(read, 30);
    expect(
      offsets.every((offset) => offset !== null && offset <= 1),
      JSON.stringify(offsets),
    ).toBe(true);
  }

  /** Renders item "a", hides the group, presses `value`, then shows the group again */
  async function reshow({
    value,
    withMotion,
    via,
  }: {
    value: Shown["value"];
    withMotion: boolean;
    via?: Hide;
  }) {
    const shown = await renderShown(withMotion, via);
    // Without Motion the CSS fallback drives it: its transition class is on the span
    if (!withMotion) expect(shown.indicator()?.classList.contains("micro-interactions")).toBe(true);
    // Hidden, the item measures as 0×0
    shown.rerender(group({ hidden: true, value: "a", via }));
    await shown.settled();
    // A separate step, so the item is pressed while the group is hidden
    shown.rerender(group({ hidden: true, value, via }));
    await shown.settled();

    shown.rerender(group({ hidden: false, value, via }));
    return shown;
  }

  const RESHOWS = (["display:none", "<Activity>"] as const).flatMap(
    (via) =>
      [
        { item: "the same item", value: "a", withMotion: true, via },
        { item: "an item pressed while hidden", value: "b", withMotion: true, via },
        { item: "the same item, without Motion", value: "a", withMotion: false, via },
        {
          item: "an item pressed while hidden, without Motion",
          value: "b",
          withMotion: false,
          via,
        },
      ] as const,
  );

  it.each(RESHOWS)(
    "shows the indicator over $item from the first frame after $via",
    async ({ value, withMotion, via }) => {
      const { root, offItem } = await reshow({ value, withMotion, via });
      await expectOverItemFromFirstFrame(root, () => offItem(value));
    },
  );

  it("still slides the indicator to the next item after display:none", async () => {
    const { indicator, offItem, rerender } = await reshow({ value: "a", withMotion: true });
    const left = () => indicator()?.getBoundingClientRect().left ?? Number.NaN;
    const start = await waitForStable(left);

    rerender(group({ hidden: false, value: "b" }));
    const lefts = await eachPaintedFrame(left, 40);
    const end = lefts.at(-1) ?? start;
    expect(end).toBeGreaterThan(start + 1);
    // In-between frames: it slides rather than jumping
    expect(
      lefts.some((l) => l > start + 1 && l < end - 1),
      JSON.stringify(lefts),
    ).toBe(true);
    await waitForStable(left);
    expect(offItem("b")).toBeLessThanOrEqual(1);
  });

  describe("and reduced motion toggled while hidden", () => {
    afterEach(() => emulateReducedMotion(false));

    it.each([
      ["turned on and off while hidden", ["hide", "reduce", "normal"]],
      ["turned on while shown and off while hidden", ["reduce", "hide", "normal"]],
    ] as const)(
      "shows the indicator over the item on every frame with reduced motion %s",
      async (_, steps) => {
        const { root, indicator, offItem, rerender, settled } = await renderShown();
        /** Waits until the CSS fallback or Motion has finished handing the indicator over */
        const handedOver = () =>
          waitForStable(() => {
            const shown = indicator();
            return shown && `${shown.className}|${shown.getAttribute("style")}`;
          });

        for (const step of steps) {
          if (step === "hide") {
            rerender(group({ hidden: true, value: "a" }));
            await settled();
          } else {
            await emulateReducedMotion(step === "reduce");
            await handedOver();
          }
        }

        rerender(group({ hidden: false, value: "a" }));
        await expectOverItemFromFirstFrame(root, () => offItem("a"));
      },
    );
  });
});

type Layout = {
  value?: "a" | "b";
  /** Style of item "a", as a font size slider would set it */
  itemStyle?: CSSProperties;
  /** Padding of the group, as a spacing slider would set it */
  groupPadding?: number;
  /** Gap between the items, as a spacing slider would set it */
  groupGap?: number;
  /** Classes of the group, besides `justify-center` */
  groupClassName?: string;
  /** Size of the group, which centres its items; by default it fits them */
  groupSize?: { width: number | string; height?: number };
  /** Width of the box around the group, which centres it */
  width?: number;
  /** Classes of item "b" */
  itemClassName?: string;
  /** Item "b" is disabled */
  disabled?: boolean;
  /** An item before the others, which a change can remove */
  lead?: boolean;
  /** Item "b" before item "a": the same keyed items, re-sorted */
  reversed?: boolean;
};

const sized = ({
  value = "a",
  itemStyle,
  groupPadding,
  groupGap,
  groupClassName,
  groupSize,
  width = 400,
  itemClassName,
  disabled,
  lead,
  reversed,
}: Layout = {}) => {
  const items = [
    // No transition of its own, so the item takes its new size at once
    <ToggleGroup.Item key="a" value="a" style={{ transition: "none", ...itemStyle }}>
      Alpha
    </ToggleGroup.Item>,
    // The label in an element of its own, for a spec to write as Motion would an icon
    <ToggleGroup.Item key="b" value="b" className={itemClassName} disabled={disabled}>
      <span>Beta</span>
    </ToggleGroup.Item>,
  ];
  return (
    <div style={{ width, display: "flex", justifyContent: "center" }}>
      <ToggleGroup.Root
        value={[value]}
        className={`justify-center ${groupClassName ?? ""}`}
        style={{ padding: groupPadding, gap: groupGap, ...groupSize }}
      >
        {lead && <ToggleGroup.Item value="lead">Lead</ToggleGroup.Item>}
        {reversed ? items.reverse() : items}
      </ToggleGroup.Root>
    </div>
  );
};

const edgesOf = (el: Element) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { left, top, width, height };
};
type Edges = ReturnType<typeof edgesOf>;

const near = (a: Edges, b: Edges) =>
  (["left", "top", "width", "height"] as const).every((edge) => Math.abs(a[edge] - b[edge]) <= 1);

/** Renders `ui` on a motion path and returns the group and its indicator getter once the path drives it */
async function renderGroup(ui: ReactElement, withMotion: boolean) {
  await enterMotionPath(withMotion);
  const result = render(ui);
  const group = result.getByRole("group");
  const indicator = () => {
    const span = group.querySelector<HTMLElement>(":scope > span");
    if (!span) throw new Error("No indicator");
    return span;
  };
  // Motion drops the CSS fallback's transition class once it drives the indicator
  await expect
    .poll(() => group.querySelector(":scope > span")?.classList.contains("micro-interactions"))
    .toBe(!withMotion);
  return { ...result, group, indicator };
}

/** Renders `layout` and returns the group's parts once the indicator rests over item "a" */
async function renderSized(withMotion: boolean, layout?: Layout) {
  const { group, indicator, ...result } = await renderGroup(sized(layout), withMotion);
  const item = (name: "Alpha" | "Beta") => result.getByRole("button", { name });
  await waitForStable(() => offBy(item("Alpha"), indicator()));
  expect(offBy(item("Alpha"), indicator())).toBeLessThanOrEqual(1);
  return { ...result, group, indicator, item };
}

/** A group that keeps its size whatever its items do */
const FIXED = { groupSize: { width: 240, height: 56 } };
/** A group as wide as the box around it */
const FILLS = { groupSize: { width: "100%" } };

/** Each resize: its name, the layout before it, and the layout after it */
const RESIZES: [string, Layout, Layout][] = [
  ["the font size of the item", {}, { itemStyle: { fontSize: 20 } }],
  // Only the item changes size
  [
    "the font size of the item, in a group of fixed size",
    FIXED,
    { ...FIXED, itemStyle: { fontSize: 20 } },
  ],
  // Only the item's border box grows: its content box doesn't, nor does the group
  [
    "the padding of the item, in a group of fixed size",
    FIXED,
    { ...FIXED, itemStyle: { paddingInline: 24 } },
  ],
  [
    "the padding of the item, in a group that fills its box",
    FILLS,
    { ...FILLS, itemStyle: { paddingInline: 24 } },
  ],
  // The group's border box grows; its content box, sized by the items, doesn't
  ["the padding of the group", {}, { groupPadding: 16 }],
  // The group's content box shrinks; its border box, sized by the box around it, doesn't
  ["the padding of a group that fills its box", FILLS, { ...FILLS, groupPadding: 16 }],
  ["the width of the box around a group that fills it", FILLS, { ...FILLS, width: 300 }],
];

/**
 * Each move: its name, the layout before it, and the layout after it. Nothing resizes: a class
 * or inline style change on the group or an item, or an item removed or moved, moves the items
 * within the group's fixed size.
 */
const MOVES: [string, Layout, Layout][] = [
  ["the gap of a group of fixed size, by its style", FIXED, { ...FIXED, groupGap: 24 }],
  ["the gap of a group of fixed size, by its class", FIXED, { ...FIXED, groupClassName: "gap-6" }],
  ["the order of the item, by its style", FIXED, { ...FIXED, itemStyle: { order: 1 } }],
  ["the order of the other item, by its class", FIXED, { ...FIXED, itemClassName: "order-first" }],
  ["the items before it, by removing one", { ...FIXED, lead: true }, FIXED],
  ["the order of the items, by re-sorting them", FIXED, { ...FIXED, reversed: true }],
];

/**
 * Renders `before`, changes it to `after`, and asserts the indicator is over item "a" in every
 * frame from the one the change paints in. That frame is read after the group's ResizeObserver,
 * before it paints: once a box resizes, or for a move, which resizes nothing, in the next frame.
 */
async function expectFollowsBeforePaint(
  withMotion: boolean,
  change: "resize" | "move",
  before: Layout,
  after: Layout,
) {
  const { group, indicator, item, rerender } = await renderSized(withMotion, before);
  const start = edgesOf(indicator());
  const read = () => ({ indicator: edgesOf(indicator()), off: offBy(item("Alpha"), indicator()) });
  const firstFrame =
    change === "resize"
      ? beforePaintOnceResized({ items: [item("Alpha"), item("Beta")], container: group }, read)
      : beforePaint(group, read);

  rerender(sized(after));
  await expectFollowsFromFirstFrame(firstFrame, read, start, near);
}

// Runs with reduced motion off: Motion springs the indicator, or without Motion the CSS
// fallback slides it with a transition
describe.each(MOTION_PATHS)("ToggleGroup indicator on a resize, $path", ({ withMotion }) => {
  it.each(RESIZES)(
    "follows a change to %s in the frame it changes in, with no frames in between",
    (_, before, after) => expectFollowsBeforePaint(withMotion, "resize", before, after),
  );

  it.each(MOVES)(
    "follows a change to %s in the frame it changes in, which moves the item without resizing anything",
    (_, before, after) => expectFollowsBeforePaint(withMotion, "move", before, after),
  );

  // The indicator's own writes (its box; with Motion, a spring's many frames of them) and a child
  // of an item that Motion animates never have the group measure again. A move has it measure once.
  it("measures again once on a move, and never for the indicator's writes or inside an item", async () => {
    const { indicator, item, rerender, getByText } = await renderSized(withMotion, FIXED);
    let batches = resizeBatches.count;
    rerender(sized({ ...FIXED, value: "b" }));
    await waitForStable(() => offBy(item("Beta"), indicator()));
    expect(resizeBatches.count).toBe(batches);

    // A style write in each frame, as Motion's to an icon in the item
    const label = getByText("Beta");
    for (const opacity of [0.8, 0.6, 0.4, 0.6, 0.8]) {
      label.style.opacity = `${opacity}`;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await waitForStable(() => offBy(item("Beta"), indicator()));
    expect(resizeBatches.count).toBe(batches);

    // A node added to and removed from an item, and from its label, as a swapped icon would be
    for (const parent of [item("Beta"), label]) {
      // Out of flow, so the item keeps its size (a flex item would add a gap)
      const extra = document.createElement("i");
      extra.style.position = "absolute";
      parent.append(extra);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      extra.remove();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await waitForStable(() => offBy(item("Beta"), indicator()));
    expect(resizeBatches.count).toBe(batches);

    batches = resizeBatches.count;
    rerender(sized({ ...FIXED, value: "b", groupGap: 24 }));
    await waitForStable(() => offBy(item("Beta"), indicator()));
    expect(offBy(item("Beta"), indicator())).toBeLessThanOrEqual(1);
    expect(resizeBatches.count).toBe(batches + 1);
  });

  it("shows the indicator once the pressed item is shown again, in a group of fixed size", async () => {
    await enterMotionPath(withMotion);
    const { getByRole, rerender } = render(sized({ ...FIXED, itemStyle: { display: "none" } }));
    const group = getByRole("group");
    const indicator = () => group.querySelector<HTMLElement>(":scope > span");
    // Hidden, the item measures 0×0: no indicator
    await waitForStable(() => indicator()?.getAttribute("style") ?? null);
    expect(indicator()).toBeNull();

    rerender(sized(FIXED));
    const alpha = getByRole("button", { name: "Alpha" });
    await expect.poll(indicator).not.toBeNull();
    await waitForStable(() => offBy(alpha, indicator() ?? alpha));
    expect(offBy(alpha, indicator() ?? alpha)).toBeLessThanOrEqual(1);
  });

  it("still slides to a newly pressed item", async () => {
    const { indicator, item, rerender } = await renderSized(withMotion);
    const start = indicator().getBoundingClientRect().left;
    rerender(sized({ value: "b" }));
    const lefts = await eachPaintedFrame(() => indicator().getBoundingClientRect().left, 40);
    await waitForStable(() => offBy(item("Beta"), indicator()));
    const end = indicator().getBoundingClientRect().left;
    expect(offBy(item("Beta"), indicator())).toBeLessThanOrEqual(1);
    expect(end).toBeGreaterThan(start + 1);
    // In-between frames: it slides rather than jumping
    expect(
      lefts.some((left) => left > start + 1 && left < end - 1),
      JSON.stringify(lefts),
    ).toBe(true);
  });

  // The pressed item grows once it is pressed, so it is measured again mid-slide. That resize
  // must not cut the slide short: a slide cut short jumps to the item in the frame its new size
  // is measured in, which this reads after the group's ResizeObserver, before that frame paints.
  it("still slides to an item that grows when it is pressed", async () => {
    const layout = { itemClassName: "data-pressed:text-xl" };
    const { group, indicator, item, rerender } = await renderSized(withMotion, layout);
    const beta = item("Beta");
    const left = (el: Element) => el.getBoundingClientRect().left;
    const grown = beforePaintOnceResized({ items: [beta], container: group }, () => ({
      indicator: left(indicator()),
      beta: left(beta),
    }));

    rerender(sized({ ...layout, value: "b" }));
    const first = await grown;
    expect(first.indicator, JSON.stringify(first)).toBeLessThan(first.beta - 1);
    await waitForStable(() => offBy(beta, indicator()));
    expect(offBy(beta, indicator())).toBeLessThanOrEqual(1);
  });

  // Every group on the page shares one ResizeObserver, whose callback commits every notified
  // group's measure in one synchronous render: a resize that reaches every group costs one
  // render per frame, not one per group
  it("commits every group on the page once when the padding of their items changes", async () => {
    await enterMotionPath(withMotion);
    const onRender = vi.fn();
    const groups = (paddingInline?: number) => (
      <Profiler id="groups" onRender={onRender}>
        {["one", "two", "three"].map((name) => (
          <ToggleGroup.Root
            key={name}
            value={["a"]}
            className="justify-center"
            style={FIXED.groupSize}
          >
            {/* Only the items' border boxes change: the groups keep their size */}
            <ToggleGroup.Item value="a" style={{ transition: "none", paddingInline }}>
              Alpha
            </ToggleGroup.Item>
            <ToggleGroup.Item value="b" style={{ transition: "none", paddingInline }}>
              Beta
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        ))}
      </Profiler>
    );
    const { rerender, getAllByRole } = render(groups());
    /** How far each group's indicator is off its pressed item; null without an indicator */
    const offsets = () =>
      getAllByRole("group").map((group) => {
        const indicator = group.querySelector(":scope > span");
        const pressed = group.querySelector('[aria-pressed="true"]');
        return indicator && pressed ? offBy(pressed, indicator) : null;
      });
    await waitForStable(offsets);
    expect(offsets().every((off) => off !== null && off <= 1)).toBe(true);

    rerender(groups(24));
    // The render above committed in act(); what follows comes from the ResizeObserver
    onRender.mockClear();
    await waitForStable(offsets);
    expect(offsets().every((off) => off !== null && off <= 1)).toBe(true);
    expect(onRender).toHaveBeenCalledTimes(1);
  });
});

// A transform on an ancestor scales the boxes on screen, not the layout, and ending it fires no ResizeObserver (a Dialog opens from scale(0.95)).
describe.each(MOTION_PATHS)("ToggleGroup indicator under a transform, $path", ({ withMotion }) => {
  const transformed = (transform?: string, zoom?: number) => (
    <div style={{ transform, zoom }}>
      <ToggleGroup.Root value={["b"]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );

  it.each([
    ["scaled down, as a Dialog is while it opens", "scale(0.95)"],
    // The rects are mirrored: they disagree with the layout offsets, which place the indicator
    ["turned around", "rotate(180deg)"],
    // The scale is 0 and divides nothing: the layout offsets place the pill, once it is back too
    ["collapsed to nothing", "scale(0)"],
    // CSS zoom scales the rects and the layout alike, without a transform
    ["zoomed in", undefined, 1.25],
  ] as [string, string | undefined, number?][])(
    "covers the pressed item while the ancestor is %s, and once it isn't",
    async (_, transform, zoom) => {
      const { getByRole, rerender, indicator } = await renderGroup(
        transformed(transform, zoom),
        withMotion,
      );
      const beta = getByRole("button", { name: "Beta, a longer item" });
      await waitForStable(() => offBy(beta, indicator()));
      // Nothing on screen to compare while the scale is 0
      if (transform !== "scale(0)") {
        expect(offBy(beta, indicator()), "under the transform").toBeLessThanOrEqual(1);
      }

      rerender(transformed(undefined));
      await waitForStable(() => offBy(beta, indicator()));
      expect(offBy(beta, indicator()), "without the transform").toBeLessThanOrEqual(1);
    },
  );
});

// Chromium reports computed sizes to 6 significant digits, and writes lengths in 1/64 px: a
// scale or size read from them must not leave the pill a step off the item of a plain group.
describe.each(MOTION_PATHS)("ToggleGroup indicator measured exactly, $path", ({ withMotion }) => {
  const framed = (props: { className?: string; itemWidth?: string; transform?: string }) => (
    <div style={{ transform: props.transform }}>
      <ToggleGroup.Root value={["b"]} className={props.className}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item
          value="b"
          style={{ marginInline: "0.37px", width: props.itemWidth, flexShrink: 0 }}
        >
          Beta, a longer item
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );

  async function renderFramed(props: Parameters<typeof framed>[0]) {
    const { getByRole, indicator } = await renderGroup(framed(props), withMotion);
    const beta = getByRole("button", { name: "Beta, a longer item" });
    await waitForStable(() => offBy(beta, indicator()));
    return { beta, indicator };
  }

  // Sizes on the 1/64 grid that need more than 6 significant digits, so the computed value is
  // a hair under: 333.328125 is read as 333.328, which Blink writes back as 333.3125
  it("keeps the pill on the item's edges in a group of fractional sizes", async () => {
    const { beta, indicator } = await renderFramed({ itemWidth: "333.328125px" });
    // The premise: the item is that wide, not shrunk by the group
    expect(beta.getBoundingClientRect().width).toBe(333.328125);
    expect(offBy(beta, indicator())).toBeLessThanOrEqual(0.001);
  });

  it.each([
    ["untransformed", undefined],
    ["scaled down", "scale(0.95)"],
  ])("keeps the pill on the item in a group with a border, %s", async (_, transform) => {
    const { beta, indicator } = await renderFramed({ className: "border-4", transform });
    expect(offBy(beta, indicator())).toBeLessThanOrEqual(1);
  });
});

// The container's scroll moves the item's rect, not its layout slot, where the pill sits
describe.each(MOTION_PATHS)(
  "ToggleGroup indicator in a scrolled group, $path",
  ({ withMotion }) => {
    it("covers the pressed item once the group is scrolled to the end", async () => {
      const { getByRole, group, indicator } = await renderGroup(
        <ToggleGroup.Root value={["f"]} className="w-40 overflow-x-auto">
          {["a", "b", "c", "d", "e", "f"].map((value) => (
            <ToggleGroup.Item key={value} value={value}>
              {`Item ${value}`}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>,
        withMotion,
      );
      const last = getByRole("button", { name: "Item f" });
      expect(group.scrollWidth, "the group overflows").toBeGreaterThan(group.clientWidth);
      group.scrollLeft = group.scrollWidth;
      expect(group.scrollLeft, "the group is scrolled").toBeGreaterThan(0);
      await waitForStable(() => offBy(last, indicator()));
      expect(offBy(last, indicator())).toBeLessThanOrEqual(1);
    });
  },
);

describe("ToggleGroup indicator with reduced motion", () => {
  beforeAll(() => emulateReducedMotion(true));
  afterAll(() => emulateReducedMotion(false));

  it("moves to a newly pressed item at once", async () => {
    const { indicator, item, rerender } = await renderSized(false);
    const start = edgesOf(indicator());
    rerender(sized({ value: "b" }));
    const frames = await eachPaintedFrame(() => edgesOf(indicator()), 20);
    expect(near(start, edgesOf(item("Beta"))), "the items differ").toBe(false);
    expect(
      frames.every((frame) => near(frame, edgesOf(item("Beta")))),
      JSON.stringify(frames),
    ).toBe(true);
  });
});

// Server HTML has no indicator: the pressed item draws the pill, then hands over to the measured
// indicator in one commit. Also with reduced motion off, where a background hand-over would fade.
describe("ToggleGroup pill from server HTML to the measured indicator", () => {
  const ui = ({ groupDisabled = false, itemDisabled = false } = {}) => (
    <StrictMode>
      <ToggleGroup.Root defaultValue={["b"]} disabled={groupDisabled}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b" disabled={itemDisabled}>
          Beta, a longer item
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </StrictMode>
  );

  /** Whether `item` paints its own pressed surface: a background or shadow on it or its ::before */
  function ownSurface(item: Element) {
    const transparent = (style: CSSStyleDeclaration) =>
      style.backgroundColor === "rgba(0, 0, 0, 0)" && style.boxShadow === "none";
    const before = getComputedStyle(item, "::before");
    const beforeShown = before.content !== "none" && before.display !== "none";
    return !transparent(getComputedStyle(item)) || (beforeShown && !transparent(before));
  }

  /** The opacity `el`, or its ::before, paints with in `group`: its own times each up to it */
  function opacityIn(group: Element, el: Element, pseudo?: "::before") {
    let opacity = pseudo ? Number(getComputedStyle(el, pseudo).opacity) : 1;
    for (let node: Element | null = el; node && node !== group; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  }

  let container: HTMLDivElement | null = null;
  let app: Root | null = null;
  afterEach(async () => {
    app?.unmount();
    container?.remove();
    app = null;
    container = null;
    await emulateReducedMotion(false);
  });

  /** Puts `page`'s server HTML in the document; returns its host, group and pressed item */
  function serverRendered(page: ReactElement) {
    const host = document.createElement("div");
    container = host;
    host.innerHTML = renderToString(page);
    document.body.append(host);
    const group = host.querySelector<HTMLElement>('[role="group"]');
    const pressed = host.querySelector<HTMLElement>("[data-pressed]");
    if (!group || !pressed) throw new Error("No pressed item in the server HTML");
    return {
      host,
      group,
      pressed,
      indicator: () => group.querySelector<HTMLElement>(":scope > span"),
    };
  }

  it.each([
    { path: "Motion", withMotion: true, reducedMotion: "no-preference" },
    { path: "the CSS fallback", withMotion: false, reducedMotion: "no-preference" },
    { path: "reduced motion", withMotion: false, reducedMotion: "reduce" },
  ] as const)(
    "paints one pressed surface in every frame, with $path",
    async ({ withMotion, reducedMotion }) => {
      await emulateReducedMotion(reducedMotion === "reduce");
      await enterMotionPath(withMotion);
      const page = ui();
      const { host, pressed, indicator } = serverRendered(page);
      // Before hydration: the item's own pill, and no indicator
      expect(indicator()).toBeNull();
      expect(ownSurface(pressed)).toBe(true);
      const pill = getComputedStyle(pressed, "::before");
      expect(pill.position).toBe("absolute");
      expect(Number.parseFloat(pill.width)).toBeCloseTo(pressed.offsetWidth, 0);
      expect(Number.parseFloat(pill.height)).toBeCloseTo(pressed.offsetHeight, 0);
      expect(Number.parseFloat(pill.zIndex)).toBeLessThan(0);

      app = hydrateRoot(host, page);
      const frames = await eachPaintedFrame(
        () => ({ indicator: indicator() !== null, own: ownSurface(pressed) }),
        30,
      );
      const log = JSON.stringify(frames);
      expect(
        frames.some((frame) => frame.indicator),
        log,
      ).toBe(true);
      // Each frame paints the item's own pill or the indicator: never both, never neither
      expect(
        frames.every((frame) => frame.indicator !== frame.own),
        log,
      ).toBe(true);
      const shown = indicator();
      if (!shown) throw new Error("No indicator after hydration");
      expect(offBy(pressed, shown)).toBeLessThanOrEqual(1);
    },
  );

  // Disabled, the pressed item dims the pill it draws: the indicator dims too, or the pill would
  // brighten as it hands over
  it.each([
    ["a disabled group", { groupDisabled: true }],
    ["a disabled pressed item", { itemDisabled: true }],
  ] as const)(
    "paints the pill at one opacity before and after hydration, in %s",
    async (_, disabled) => {
      await enterMotionPath(false);
      const page = ui(disabled);
      const { host, group, pressed, indicator } = serverRendered(page);
      const before = opacityIn(group, pressed, "::before");
      expect(before, "the item dims its own pill").toBe(0.5);

      app = hydrateRoot(host, page);
      await expect.poll(indicator).not.toBeNull();
      const shown = indicator();
      if (!shown) throw new Error("No indicator after hydration");
      expect(opacityIn(group, shown)).toBe(before);
    },
  );

  // The pill is gated on the group having no indicator: a consumer's ::before stays theirs
  it.each([
    ["an unpressed", "a"],
    ["the pressed", "b"],
  ] as const)(
    "keeps a consumer's ::before on %s item after the indicator is measured",
    async (_, own) => {
      await enterMotionPath(false);
      const { getByRole, container: host } = render(
        <ToggleGroup.Root defaultValue={["b"]}>
          {(["a", "b"] as const).map((value) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              className={
                value === own ? "before:block before:h-1 before:w-1 before:content-['']" : undefined
              }
            >
              {value === "a" ? "Alpha" : "Beta"}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>,
      );
      const item = getByRole("button", { name: own === "a" ? "Alpha" : "Beta" });
      await expect.poll(() => host.querySelector("[role='group'] > span")).not.toBeNull();
      const before = getComputedStyle(item, "::before");
      expect(before.display).toBe("block");
      expect(before.width).toBe("4px");
      expect(before.position).not.toBe("absolute");
      expect(before.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    },
  );
});

// An item disabled while pressed fades to 50%. The indicator fades with it, frame for frame; with
// reduced motion both change at once.
describe("ToggleGroup indicator under the pressed item disabled at runtime", () => {
  const ui = (disabled: boolean, rootClassName?: string) => (
    <ToggleGroup.Root value={["b"]} className={rootClassName}>
      <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
      <ToggleGroup.Item value="b" disabled={disabled}>
        Beta
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
  const opacityOf = (el: Element) => Number(getComputedStyle(el).opacity);

  /** Both opacities in the next 40 painted frames, asserted within 0.01 of each other in each */
  async function expectFadesWith(item: Element, indicator: () => Element) {
    const frames = await eachPaintedFrame(
      () => ({ item: opacityOf(item), indicator: opacityOf(indicator()) }),
      40,
    );
    const log = JSON.stringify(frames);
    expect(
      frames.every((frame) => Math.abs(frame.indicator - frame.item) < 0.01),
      log,
    ).toBe(true);
    // Values between the two ends: it faded rather than jumped
    const faded = frames.some(({ indicator: opacity }) => opacity > 0.5 && opacity < 1);
    return { faded, log };
  }

  afterEach(() => emulateReducedMotion(false));

  it.each([
    ...MOTION_PATHS.map(({ path, withMotion }) => ({ path, withMotion, reduced: false })),
    { path: "reduced motion", withMotion: false, reduced: true },
  ])("dims the indicator with the item, on $path", async ({ withMotion, reduced }) => {
    await emulateReducedMotion(reduced);
    const { indicator, rerender, getByRole } = await renderGroup(ui(false), withMotion);
    const item = getByRole("button", { name: "Beta" });
    await waitForStable(() => offBy(item, indicator()));

    rerender(ui(true));
    const { faded, log } = await expectFadesWith(item, indicator);
    expect(faded, log).toBe(!reduced);
    expect(await waitForStable(() => opacityOf(indicator()))).toBe(0.5);
  });

  // Without Motion the indicator slides on its own 200ms snappy curve. An item disabled on the way
  // fades on its own curve and duration, and the pill under it fades with it.
  it("dims the indicator with an item disabled mid-slide, on the CSS fallback", async () => {
    const { indicator, item, rerender } = await renderSized(false);
    rerender(sized({ value: "b" }));
    await untilChanged(() => edgesOf(indicator()));
    expect(offBy(item("Beta"), indicator()), "the slide is under way").toBeGreaterThan(1);

    rerender(sized({ value: "b", disabled: true }));
    const { faded, log } = await expectFadesWith(item("Beta"), indicator);
    expect(faded, log).toBe(true);
  });

  // A consumer's own default curve (`--default-transition-timing-function` in their theme) reaches
  // the item's fade and the pill's alike
  it.each(MOTION_PATHS)(
    "dims the indicator on the item's curve when the default curve changes, on $path",
    async ({ withMotion }) => {
      const linear = "[--default-transition-timing-function:linear]";
      const { indicator, rerender, getByRole } = await renderGroup(ui(false, linear), withMotion);
      const item = getByRole("button", { name: "Beta" });
      await waitForStable(() => offBy(item, indicator()));

      rerender(ui(true, linear));
      const { faded, log } = await expectFadesWith(item, indicator);
      expect(faded, log).toBe(true);
    },
  );

  // The item snaps because `.micro-interactions` is `transition: none !important` under reduced
  // motion. Motion drives the indicator without that class, so its `motion-reduce:transition-none`
  // has to snap it too, or it fades on until Motion hands it back.
  it("snaps the indicator to 50% with the item when reduced motion turns on mid-fade", async () => {
    const { indicator, rerender, getByRole } = await renderGroup(ui(false), true);
    const item = getByRole("button", { name: "Beta" });
    await waitForStable(() => offBy(item, indicator()));

    // 10s outlasts SETTLE_TIMEOUT_MS, the wait for the preference to land. The indicator is
    // internal: a class on the root reaches it and the items.
    rerender(ui(true, "[&>span]:duration-[10s] [&>button]:duration-[10s]"));
    // Every painted frame from here on. The frames that show a missing class come before
    // `emulateReducedMotion` resolves, so a read after it would miss them.
    const sampled = eachPaintedFrame(
      () => ({ item: opacityOf(item), indicator: opacityOf(indicator()) }),
      40,
    );
    await untilChanged(() => opacityOf(item));
    await emulateReducedMotion(true);
    const frames = await sampled;
    const log = JSON.stringify(frames);
    expect(
      frames.every((frame) => Math.abs(frame.indicator - frame.item) < 0.01),
      log,
    ).toBe(true);
    // The preference landed within the sampled frames: nothing else ends a fade of 10s
    expect(
      frames.some((frame) => frame.item === 0.5),
      log,
    ).toBe(true);
  });

  // The slide ends with the spring. The pill's fade under an item disabled on the way is no slide:
  // a resize after the spring moves the indicator at once, as at rest.
  it("jumps on a resize after the spring, while the pill still fades", async () => {
    // 10s outlasts the spring. The indicator is internal: a class on the root reaches it.
    const slowFade = { groupClassName: "[&>span]:duration-[10s]" };
    const { group, indicator, item, rerender } = await renderSized(true, slowFade);
    rerender(sized({ ...slowFade, value: "b", disabled: true }));
    const beta = item("Beta");
    await waitForStable(() => offBy(beta, indicator()));
    expect(opacityOf(indicator()), "the pill still fades").toBeGreaterThan(0.5);

    const start = edgesOf(indicator());
    const read = () => ({ indicator: edgesOf(indicator()), off: offBy(beta, indicator()) });
    const firstFrame = beforePaintOnceResized(
      { items: [item("Alpha"), beta], container: group },
      read,
    );
    rerender(sized({ ...slowFade, value: "b", disabled: true, itemClassName: "px-6" }));
    await expectFollowsFromFirstFrame(firstFrame, read, start, near);
  });
});
