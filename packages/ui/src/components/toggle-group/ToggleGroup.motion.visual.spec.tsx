import { render } from "@testing-library/react";
import { cancelFrame, frame } from "motion/react";
import { createRef, type RefObject } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { insetsWithin, waitForStable } from "../../VisualTest.utils";
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

describe("ToggleGroup indicator with Motion after display:none", () => {
  type Shown = { hidden: boolean; value: "a" | "b" };

  const group = ({ hidden, value }: Shown) => (
    <div style={hidden ? { display: "none" } : undefined}>
      <ToggleGroup.Root value={[value]}>
        <ToggleGroup.Item value="a">Alpha</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Beta, a longer item</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );

  /**
   * Calls `read` once a frame for `frames` frames, after Motion's render step: the values that
   * frame paints, Motion's writes for it included
   */
  const eachPaintedFrame = <T,>(read: () => T, frames: number) =>
    new Promise<T[]>((resolve) => {
      const values: T[] = [];
      const step = () => {
        values.push(read());
        if (values.length < frames) return;
        cancelFrame(step);
        resolve(values);
      };
      frame.postRender(step, true);
    });

  /**
   * Renders the group on Alpha and returns its elements. Read before it hides: Testing Library
   * doesn't find hidden elements by role.
   */
  async function renderShown() {
    await reloadMotion();
    const { rerender, getByRole } = render(group({ hidden: false, value: "a" }));
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
    const offBy = (value: Shown["value"]) => {
      const shown = indicator();
      if (!shown?.checkVisibility()) return null;
      return Math.max(...Object.values(insetsWithin(items[value], shown)).map(Math.abs));
    };
    const settled = () => waitForStable(() => indicator()?.getAttribute("style") ?? null);
    return { rerender, indicator, offBy, settled };
  }

  /** The offsets of each painted frame with a visible indicator, for 30 frames */
  async function visibleOffsets(offBy: () => number | null) {
    const offsets = (await eachPaintedFrame(offBy, 30)).filter((offset) => offset !== null);
    expect(offsets.length).toBeGreaterThan(0);
    return offsets;
  }

  /** Renders item "a", hides the group, presses `value`, then shows the group again */
  async function reshow(value: Shown["value"]) {
    const shown = await renderShown();
    // Hidden, the item measures as 0×0
    shown.rerender(group({ hidden: true, value: "a" }));
    await shown.settled();
    // A separate step, so the item is pressed while the group is hidden
    shown.rerender(group({ hidden: true, value }));
    await shown.settled();

    shown.rerender(group({ hidden: false, value }));
    return shown;
  }

  it.each([
    ["the same item", "a"],
    ["an item pressed while hidden", "b"],
  ] as const)(
    "shows the indicator over %s on its first visible frame after display:none",
    async (_, value) => {
      const { offBy } = await reshow(value);
      const offsets = await visibleOffsets(() => offBy(value));
      // No growing from 0×0, or sliding from where it was before it hid
      expect(offsets[0], JSON.stringify(offsets)).toBeLessThanOrEqual(1);
      expect(Math.max(...offsets), JSON.stringify(offsets)).toBeLessThanOrEqual(1);
    },
  );

  it("still slides the indicator to the next item after display:none", async () => {
    const { indicator, offBy, rerender } = await reshow("a");
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
    expect(offBy("b")).toBeLessThanOrEqual(1);
  });

  describe("and reduced motion toggled while hidden", () => {
    afterEach(async () => {
      await commands.emulateMedia({ reducedMotion: "no-preference" });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    it.each([
      ["turned on and off while hidden", true],
      ["turned on while shown and off while hidden", false],
    ] as const)(
      "shows the indicator over the item on every frame with reduced motion %s",
      async (_, onWhileHidden) => {
        const { indicator, offBy, rerender, settled } = await renderShown();
        /** Waits until the CSS fallback or Motion has finished handing the indicator over */
        const handedOver = () =>
          waitForStable(() => {
            const shown = indicator();
            return shown && `${shown.className}|${shown.getAttribute("style")}`;
          });

        if (!onWhileHidden) {
          await commands.emulateMedia({ reducedMotion: "reduce" });
          await handedOver();
        }
        rerender(group({ hidden: true, value: "a" }));
        await settled();
        if (onWhileHidden) {
          await commands.emulateMedia({ reducedMotion: "reduce" });
          await handedOver();
        }
        await commands.emulateMedia({ reducedMotion: "no-preference" });
        await handedOver();

        rerender(group({ hidden: false, value: "a" }));
        const offsets = await visibleOffsets(() => offBy("a"));
        expect(Math.max(...offsets), JSON.stringify(offsets)).toBeLessThanOrEqual(1);
      },
    );
  });
});
