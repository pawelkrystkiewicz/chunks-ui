import { render } from "@testing-library/react";
import { createRef, useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { eachPaintedFrame, insetsWithin, waitForStable } from "../../VisualTest.utils";
import { Tabs, type TabsContentsProps } from "./index";

// Runs with reduced motion off, so Tabs.Contents slides and resizes with Motion
const HEIGHTS = { short: 40, tall: 120 } as const;
type Panel = keyof typeof HEIGHTS;

type ContentsOptions = Pick<TabsContentsProps, "ref" | "transition">;

/**
 * Tabs.Contents with a short and a tall panel, showing `value`. `ref` is passed even when it is
 * undefined: an explicit `ref={undefined}` must not switch the animation off either.
 */
const panelsOfTwoHeights = (value: Panel, { ref, transition }: ContentsOptions = {}) => (
  <Tabs.Root value={value}>
    <Tabs.Contents data-testid="contents" ref={ref} transition={transition}>
      <Tabs.Content value="short">
        <div style={{ height: HEIGHTS.short, paddingTop: 20, boxSizing: "border-box" }}>
          <span data-testid="marker">Short panel</span>
        </div>
      </Tabs.Content>
      <Tabs.Content value="tall">
        <div style={{ height: HEIGHTS.tall }}>Tall panel</div>
      </Tabs.Content>
    </Tabs.Contents>
  </Tabs.Root>
);

/**
 * Renders `from`, switches to `to`, and records the container height every frame until it
 * settles, along with the tall panel's left edge before and after.
 */
async function switchPanels(from: Panel, to: Panel, options?: ContentsOptions) {
  await reloadMotion();
  const { rerender, getByTestId } = render(panelsOfTwoHeights(from, options));
  const contents = getByTestId("contents");
  const tallPanel = page.getByText("Tall panel").element();
  const height = () => contents.getBoundingClientRect().height;
  const start = await waitForStable(height);
  const tallLeftBefore = tallPanel.getBoundingClientRect().left;

  rerender(panelsOfTwoHeights(to, options));
  const heights: number[] = [];
  const end = await waitForStable(() => {
    heights.push(height());
    return heights.at(-1) ?? 0;
  });
  return {
    contents,
    start,
    end,
    heights,
    tallLeftBefore,
    tallLeftAfter: tallPanel.getBoundingClientRect().left,
  };
}

/** Some frame between `from` and `to` (exclusive, by more than 1px): it eased, not jumped. */
const passedThrough = (heights: number[], from: number, to: number) =>
  heights.some((h) => h > Math.min(from, to) + 1 && h < Math.max(from, to) - 1);

describe("Tabs with Motion", () => {
  it("mounts a panel's children once when Motion has already loaded", async () => {
    await reloadMotion();
    let mounts = 0;
    function Panel() {
      useEffect(() => {
        mounts++;
      }, []);
      return <p>Panel A</p>;
    }
    render(
      <Tabs.Root defaultValue="a">
        <Tabs.Contents>
          <Tabs.Content value="a">
            <Panel />
          </Tabs.Content>
          <Tabs.Content value="b">Panel B</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mounts).toBe(1);
  });

  // Motion's import settles in a later task, so the synchronous steps after render() happen
  // while it is still loading
  it.each([
    [
      "Contents",
      <Tabs.Contents key="contents">
        <Tabs.Content value="a">
          <input aria-label="Name" />
        </Tabs.Content>
        <Tabs.Content value="b">Panel B</Tabs.Content>
      </Tabs.Contents>,
    ],
    [
      "Animate",
      <Tabs.Animate key="animate">
        <input aria-label="Name" />
      </Tabs.Animate>,
    ],
  ])(
    "keeps text typed into Tabs.%s, and its focus, when Motion finishes loading",
    async (_, ui) => {
      const loading = reloadMotion();
      render(<Tabs.Root defaultValue="a">{ui}</Tabs.Root>);
      const input = page.getByRole("textbox", { name: "Name" }).element() as HTMLInputElement;
      input.value = "Ada";
      input.focus();

      await loading;
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(document.activeElement).toBe(input);
      await expect.element(page.getByRole("textbox", { name: "Name" })).toHaveValue("Ada");
    },
  );

  it("slides Tabs.Contents to the next panel with Motion", async () => {
    await reloadMotion();
    const tabs = (value: string) => (
      <Tabs.Root value={value}>
        <Tabs.Contents>
          <Tabs.Content value="a">Panel A</Tabs.Content>
          <Tabs.Content value="b">Panel B</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    );
    const { rerender } = render(tabs("a"));
    const panelB = page.getByText("Panel B").element();
    const startLeft = panelB.getBoundingClientRect().left;

    rerender(tabs("b"));
    const lefts: number[] = [];
    for (let frame = 0; frame < 60; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      lefts.push(panelB.getBoundingClientRect().left);
    }
    const endLeft = lefts.at(-1) ?? startLeft;
    expect(endLeft).toBeLessThan(startLeft);
    // In-between frames: the panel slides in rather than jumping
    expect(lefts.some((left) => left < startLeft - 1 && left > endLeft + 1)).toBe(true);
  });

  it("animates a new Tabs.Animate panel in with Motion", async () => {
    await reloadMotion();
    const tabs = (value: string) => (
      <Tabs.Root value={value}>
        <Tabs.Animate>
          <p>{value === "a" ? "Panel A" : "Panel B"}</p>
        </Tabs.Animate>
      </Tabs.Root>
    );
    const { rerender } = render(tabs("a"));
    await new Promise((resolve) => setTimeout(resolve, 600));

    rerender(tabs("b"));
    const opacities: number[] = [];
    for (let frame = 0; frame < 30; frame++) {
      const pane = page.getByText("Panel B").element().parentElement;
      if (pane) opacities.push(Number(getComputedStyle(pane).opacity));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  });
});

describe("Tabs animations that must stop", () => {
  // Slow and linear, so each check below happens mid-animation
  const slow = { type: "tween", duration: 2 } as const;
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

  afterEach(async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    // Motion reads the preference from the media query's change event
    await nextFrame();
  });

  async function enterPane() {
    await reloadMotion();
    const tabs = (value: string) => (
      <Tabs.Root value={value}>
        <Tabs.Animate transition={slow}>
          <p>Panel {value}</p>
        </Tabs.Animate>
      </Tabs.Root>
    );
    const result = render(tabs("a"));
    result.rerender(tabs("b"));
    const pane = page.getByText("Panel b").element().parentElement as HTMLElement;
    await nextFrame();
    const transform = pane.style.transform;
    await nextFrame();
    // Mid-entry: still fading in and still moving
    expect(Number(getComputedStyle(pane).opacity)).toBeLessThan(1);
    expect(pane.style.transform).not.toBe(transform);
    return { ...result, pane };
  }

  it("finishes a Tabs.Animate entry when reduced motion turns on, and does not replay it", async () => {
    const { pane } = await enterPane();
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => getComputedStyle(pane).opacity, { timeout: 200 }).toBe("1");
    expect(new DOMMatrix(getComputedStyle(pane).transform).m42).toBe(0);

    await commands.emulateMedia({ reducedMotion: "no-preference" });
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(getComputedStyle(pane).opacity).toBe("1");
    }
  });

  it("stops a Tabs.Animate entry when the pane unmounts", async () => {
    const { pane, unmount } = await enterPane();
    unmount();
    expect(pane.getAnimations()).toEqual([]);
    // Stopping may write the value it stopped at once; after that nothing moves
    await nextFrame();
    const transform = pane.style.transform;
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(pane.style.transform).toBe(transform);
    }
  });

  it("stops a Tabs.Contents slide when it unmounts", async () => {
    await reloadMotion();
    const tabs = (value: string) => (
      <Tabs.Root value={value}>
        <Tabs.Contents transition={slow}>
          <Tabs.Content value="a">Panel A</Tabs.Content>
          <Tabs.Content value="b">Panel B</Tabs.Content>
        </Tabs.Contents>
      </Tabs.Root>
    );
    const { rerender, unmount } = render(tabs("a"));
    rerender(tabs("b"));
    await nextFrame();
    await nextFrame();
    // Content › panel wrapper › track
    const track = page.getByText("Panel B").element().parentElement?.parentElement as HTMLElement;
    unmount();
    await nextFrame();
    const transform = track.style.transform;
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(track.style.transform).toBe(transform);
    }
  });

  /** Switches short -> tall with the slow transition and returns mid-resize. */
  async function resizeMidway() {
    await reloadMotion();
    const result = render(panelsOfTwoHeights("short", { transition: slow }));
    const contents = result.getByTestId("contents");
    await waitForStable(() => contents.offsetHeight);
    result.rerender(panelsOfTwoHeights("tall", { transition: slow }));
    await nextFrame();
    await nextFrame();
    await nextFrame();
    // Mid-resize: between the two panel heights
    const height = Number.parseFloat(contents.style.height);
    expect(height).toBeGreaterThan(HEIGHTS.short);
    expect(height).toBeLessThan(HEIGHTS.tall);
    return { ...result, contents };
  }

  it("stops a Tabs.Contents resize when it unmounts", async () => {
    const { contents, unmount } = await resizeMidway();
    unmount();
    // Stopping may write the value it stopped at once; after that nothing changes
    await nextFrame();
    const height = contents.style.height;
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(contents.style.height).toBe(height);
    }
  });

  it("drops a Tabs.Contents slide and resize when reduced motion turns on", async () => {
    const { contents } = await resizeMidway();
    const track = contents.firstElementChild as HTMLElement;
    await commands.emulateMedia({ reducedMotion: "reduce" });
    // The inline styles are cleared, so the CSS layout shows the tall panel unshifted, full height
    await expect.poll(() => contents.style.height, { timeout: 1000 }).toBe("");
    for (let frame = 0; frame < 5; frame++) {
      await nextFrame();
      expect(contents.style.height).toBe("");
      expect(track.style.transform).toBe("");
      expect(Math.abs(contents.offsetHeight - HEIGHTS.tall)).toBeLessThanOrEqual(1);
    }
  });
});

describe("Tabs.Contents height with Motion", () => {
  it.each([
    ["short", "tall"],
    ["tall", "short"],
  ] as const)("animates from the %s panel's height to the %s panel's", async (from, to) => {
    const { start, end, heights } = await switchPanels(from, to);

    expect(Math.abs(start - HEIGHTS[from])).toBeLessThanOrEqual(1);
    expect(Math.abs(end - HEIGHTS[to])).toBeLessThanOrEqual(1);
    expect(passedThrough(heights, start, end)).toBe(true);
  });

  it("cannot be scrolled programmatically, so the active panel's top stays in view", async () => {
    await reloadMotion();
    // The short panel is active; the tall one next to it makes the track taller than the container
    const { getByTestId } = render(panelsOfTwoHeights("short"));
    const contents = getByTestId("contents");
    await waitForStable(() => contents.getBoundingClientRect().height);

    // The marker sits 20px down the short panel
    getByTestId("marker").scrollIntoView();
    expect(contents.scrollTop).toBe(0);
  });

  it("never shows the previous panel's height after a quick switch back", async () => {
    await reloadMotion();
    // Instant, so each frame shows the height the container was last told to have
    const transition = { type: "tween", duration: 0 } as const;
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const { rerender, getByTestId } = render(panelsOfTwoHeights("short", { transition }));
    const contents = getByTestId("contents");
    // Resolves inside an animation frame, so the switches below happen there too
    await waitForStable(() => contents.offsetHeight);

    rerender(panelsOfTwoHeights("tall", { transition }));
    // Later this frame the tall panel's ResizeObserver queues a re-measure for the next one;
    // switch back at the start of that frame, before the re-measure runs
    await nextFrame();
    rerender(panelsOfTwoHeights("short", { transition }));
    const heights: number[] = [];
    for (let frame = 0; frame < 10; frame++) {
      await nextFrame();
      heights.push(contents.offsetHeight);
    }
    expect(heights.every((h) => Math.abs(h - HEIGHTS.short) <= 1)).toBe(true);
  });

  it("sizes to the panel's layout height inside a scaled ancestor", async () => {
    await reloadMotion();
    // Like a Dialog popup that mounts at scale(0.95): a transform changes the size on screen,
    // not the layout size, and does not trigger a ResizeObserver
    const { getByTestId } = render(
      <div style={{ transform: "scale(0.5)" }}>{panelsOfTwoHeights("short")}</div>,
    );
    const contents = getByTestId("contents");
    const height = await waitForStable(() => contents.offsetHeight);
    expect(Math.abs(height - HEIGHTS.short)).toBeLessThanOrEqual(1);
  });
});

describe("Tabs refs with Motion", () => {
  it("gives a ref on Tabs.Contents the container and still slides and resizes", async () => {
    const ref = createRef<HTMLDivElement>();
    const { contents, start, end, heights, tallLeftBefore, tallLeftAfter } = await switchPanels(
      "short",
      "tall",
      { ref },
    );

    expect(ref.current).toBe(contents);
    // Slid: the tall panel moved left into view
    expect(tallLeftAfter).toBeLessThan(tallLeftBefore - 1);
    // Resized with Motion
    expect(Math.abs(end - HEIGHTS.tall)).toBeLessThanOrEqual(1);
    expect(passedThrough(heights, start, end)).toBe(true);
  });

  it("gives a ref on Tabs.Animate the current pane and still animates it in", async () => {
    const ref = createRef<HTMLDivElement>();
    await reloadMotion();
    const tabs = (value: string) => (
      <Tabs.Root value={value}>
        <Tabs.Animate ref={ref}>
          <p>Panel {value}</p>
        </Tabs.Animate>
      </Tabs.Root>
    );
    const { rerender } = render(tabs("a"));
    expect(ref.current).toBe(page.getByText("Panel a").element().parentElement);
    await new Promise((resolve) => setTimeout(resolve, 600));

    rerender(tabs("b"));
    const pane = page.getByText("Panel b").element().parentElement as HTMLElement;
    expect(ref.current).toBe(pane);
    const opacities: number[] = [];
    for (let frame = 0; frame < 30; frame++) {
      opacities.push(Number(getComputedStyle(pane).opacity));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  });
});

describe("Tabs.Indicator with Motion", () => {
  type Shown = { hidden: boolean; value: "a" | "b" };

  const tabs = ({ hidden, value }: Shown) => (
    <div style={hidden ? { display: "none" } : undefined}>
      <Tabs.Root value={value}>
        <Tabs.List>
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta, a longer tab</Tabs.Tab>
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>
    </div>
  );

  /** The largest distance between an edge of the indicator and the same edge of the tab */
  const offBy = (tab: Element, indicator: Element) =>
    Math.max(...Object.values(insetsWithin(tab, indicator)).map(Math.abs));

  /** Renders tab "a", hides the tabs, selects `value`, then shows them again */
  async function reshow(value: Shown["value"]) {
    await reloadMotion();
    const { rerender, getByTestId, getByRole } = render(tabs({ hidden: false, value: "a" }));
    const indicator = getByTestId("indicator");
    await waitForStable(() => indicator.getBoundingClientRect().width);

    // Hidden, Base UI measures the active tab as 0×0
    rerender(tabs({ hidden: true, value: "a" }));
    await waitForStable(() => indicator.getAttribute("style"));
    // A separate step: selected in the same render that hides the tabs, Base UI would still
    // measure the tab while it shows
    rerender(tabs({ hidden: true, value }));
    await waitForStable(() => indicator.getAttribute("style"));

    rerender(tabs({ hidden: false, value }));
    const tab = getByRole("tab", { name: value === "a" ? "Alpha" : "Beta, a longer tab" });
    return { indicator, tab, rerender };
  }

  it.each([
    ["the same tab", "a"],
    ["a tab chosen while hidden", "b"],
  ] as const)(
    "shows the indicator over %s on its first visible frame after display:none",
    async (_, value) => {
      const { indicator, tab } = await reshow(value);
      const visible = await eachPaintedFrame(
        () => (indicator.checkVisibility() ? offBy(tab, indicator) : null),
        30,
      );
      const offsets = visible.filter((offset) => offset !== null);
      expect(offsets.length).toBeGreaterThan(0);
      // No growing from 0×0, or sliding from where it was before it hid
      expect(offsets[0]).toBeLessThanOrEqual(1);
      expect(Math.max(...offsets)).toBeLessThanOrEqual(1);
    },
  );

  it("still slides the indicator to the next tab after display:none", async () => {
    const { indicator, rerender } = await reshow("a");
    const start = await waitForStable(() => indicator.getBoundingClientRect().left);

    rerender(tabs({ hidden: false, value: "b" }));
    const lefts = await eachPaintedFrame(() => indicator.getBoundingClientRect().left, 40);
    const end = lefts.at(-1) ?? start;
    expect(end).toBeGreaterThan(start + 1);
    // In-between frames: it slides rather than jumping
    expect(lefts.some((left) => left > start + 1 && left < end - 1)).toBe(true);
  });

  describe("and reduced motion toggled while hidden", () => {
    afterEach(async () => {
      await commands.emulateMedia({ reducedMotion: "no-preference" });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    /** Waits until the CSS fallback or Motion has finished handing the indicator over */
    const handedOver = (indicator: Element) =>
      waitForStable(() => `${indicator.className}|${indicator.getAttribute("style")}`);

    // The CSS fallback removed Motion's inline values while Motion still holds them. Back with
    // Motion, the jump must write them all, not only the ones that changed since.
    it.each([
      ["turned on and off while hidden", true],
      ["turned on while shown and off while hidden", false],
    ] as const)(
      "shows the indicator over the tab again with reduced motion %s",
      async (_, onWhileHidden) => {
        await reloadMotion();
        const { rerender, getByTestId, getByRole } = render(tabs({ hidden: false, value: "a" }));
        const indicator = getByTestId("indicator");
        const tab = getByRole("tab", { name: "Alpha" });
        await waitForStable(() => indicator.getBoundingClientRect().width);
        expect(offBy(tab, indicator)).toBeLessThanOrEqual(1);

        if (!onWhileHidden) {
          await commands.emulateMedia({ reducedMotion: "reduce" });
          await handedOver(indicator);
        }
        rerender(tabs({ hidden: true, value: "a" }));
        await waitForStable(() => indicator.getAttribute("style"));
        if (onWhileHidden) {
          await commands.emulateMedia({ reducedMotion: "reduce" });
          await handedOver(indicator);
        }
        await commands.emulateMedia({ reducedMotion: "no-preference" });
        await handedOver(indicator);

        rerender(tabs({ hidden: false, value: "a" }));
        await handedOver(indicator);
        expect(indicator.checkVisibility()).toBe(true);
        expect(offBy(tab, indicator)).toBeLessThanOrEqual(1);
      },
    );
  });
});
