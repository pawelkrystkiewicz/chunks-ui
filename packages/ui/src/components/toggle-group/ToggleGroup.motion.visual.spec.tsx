import { render } from "@testing-library/react";
import { Activity, type CSSProperties, createRef, type RefObject } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import {
  eachPaintedFrame,
  enterMotionPath,
  insetsWithin,
  MOTION_PATHS,
  offBy,
  waitForStable,
} from "../../VisualTest.utils";
import { ToggleGroup, type ToggleGroupRootProps } from "./index";

// Runs with reduced motion off, so Motion drives the indicator; the CSS-path cases turn reduced
// motion on. A consumer's ref must not replace the refs the indicator relies on: the Root's
// (it measures against the container) and an Item's (how the Root finds the item).

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
  beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));

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
  beforeAll(() => commands.emulateMedia({ reducedMotion }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));

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
  beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));

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

/**
 * Reads `read` in the next frame in which `target` changes size, after the group's
 * ResizeObserver callbacks and before that frame paints. An observer created after the group's
 * gets its callback after the group's, in the same frame.
 */
function beforePaint<T>(target: Element, read: () => T) {
  return new Promise<T>((resolve) => {
    const observer = new ResizeObserver(() => {
      observer.disconnect();
      resolve(read());
    });
    observer.observe(target);
  });
}

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
    afterEach(async () => {
      await commands.emulateMedia({ reducedMotion: "no-preference" });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

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
            await commands.emulateMedia({
              reducedMotion: step === "reduce" ? "reduce" : "no-preference",
            });
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
  /** Size of the group, which centres its items; by default it fits them */
  groupSize?: { width: number | string; height?: number };
  /** Width of the box around the group, which centres it */
  width?: number;
  /** Classes of item "b" */
  itemClassName?: string;
};

const sized = ({
  value = "a",
  itemStyle,
  groupPadding,
  groupSize,
  width = 400,
  itemClassName,
}: Layout = {}) => (
  <div style={{ width, display: "flex", justifyContent: "center" }}>
    <ToggleGroup.Root
      value={[value]}
      className="justify-center"
      style={{ padding: groupPadding, ...groupSize }}
    >
      {/* No transition of its own, so the item takes its new size at once */}
      <ToggleGroup.Item value="a" style={{ transition: "none", ...itemStyle }}>
        Alpha
      </ToggleGroup.Item>
      <ToggleGroup.Item value="b" className={itemClassName}>
        Beta
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>
);

const edgesOf = (el: Element) => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return { left, top, width, height };
};
type Edges = ReturnType<typeof edgesOf>;

const near = (a: Edges, b: Edges) =>
  (["left", "top", "width", "height"] as const).every((edge) => Math.abs(a[edge] - b[edge]) <= 1);

/** Renders `layout` and returns the group's parts once the indicator rests over item "a" */
async function renderSized(withMotion: boolean, layout?: Layout) {
  await enterMotionPath(withMotion);
  const result = render(sized(layout));
  const group = result.getByRole("group");
  const indicator = () => {
    const span = group.querySelector<HTMLElement>(":scope > span");
    if (!span) throw new Error("No indicator");
    return span;
  };
  // Motion drops the CSS fallback's transition class once it drives the indicator
  await expect
    .poll(() => group.querySelector(":scope > span")?.classList.contains("micro-interactions"), {
      timeout: 5000,
    })
    .toBe(!withMotion);
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

// Runs with reduced motion off: Motion springs the indicator, or without Motion the CSS
// fallback slides it with a transition
describe.each(MOTION_PATHS)("ToggleGroup indicator on a resize, $path", ({ withMotion }) => {
  it.each(RESIZES)(
    "follows a change to %s at once, with no frames in between",
    async (_, before, after) => {
      const { indicator, item, rerender } = await renderSized(withMotion, before);
      const start = edgesOf(indicator());

      rerender(sized(after));
      const frames = await eachPaintedFrame(
        () => ({ indicator: edgesOf(indicator()), off: offBy(item("Alpha"), indicator()) }),
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
      // The first frame is read before the ResizeObserver measures the item, and with Motion the
      // jump is written in the frame after it: one frame may show the old box, and no more
      expect(frames.filter((frame) => frame.off > 1).length, log).toBeLessThanOrEqual(1);
    },
  );

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

  /** The indicator's left edge for 40 painted frames after `value` becomes "b" */
  async function slideToBeta(layout: Layout = {}) {
    const { indicator, item, rerender } = await renderSized(withMotion, layout);
    const start = indicator().getBoundingClientRect().left;
    rerender(sized({ ...layout, value: "b" }));
    const lefts = await eachPaintedFrame(() => indicator().getBoundingClientRect().left, 40);
    await waitForStable(() => offBy(item("Beta"), indicator()));
    const end = indicator().getBoundingClientRect().left;
    expect(offBy(item("Beta"), indicator())).toBeLessThanOrEqual(1);
    expect(end).toBeGreaterThan(start + 1);
    return lefts.filter((left) => left > start + 1 && left < end - 1);
  }

  it("still slides to a newly pressed item", async () => {
    const between = await slideToBeta();
    expect(between.length).toBeGreaterThan(0);
  });

  // The pressed item grows once it is pressed, so it is measured again mid-slide. That resize
  // must not cut the slide short by jumping to the end. A slide cut short shows at most one frame
  // in between; the bar is 2, as a loaded run paints few frames during a whole slide.
  it("still slides to an item that grows when it is pressed", async () => {
    const between = await slideToBeta({ itemClassName: "data-pressed:text-xl" });
    expect(between.length).toBeGreaterThanOrEqual(2);
  });
});

describe("ToggleGroup indicator with reduced motion", () => {
  beforeAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));
  afterAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));

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
