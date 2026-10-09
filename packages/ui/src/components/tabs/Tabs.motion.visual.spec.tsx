import { render } from "@testing-library/react";
import { createRef, type Ref, useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { waitForStable } from "../../VisualTest.utils";
import { Tabs } from "./index";

// Runs with reduced motion off, so Tabs.Contents slides and resizes with Motion
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
});

const HEIGHTS = { short: 40, tall: 120 } as const;
type Panel = keyof typeof HEIGHTS;

/**
 * Tabs.Contents with a short and a tall panel, showing `value`. `ref` is passed even when it is
 * undefined: an explicit `ref={undefined}` must not switch the animation off either.
 */
const panelsOfTwoHeights = (value: Panel, ref?: Ref<HTMLDivElement>) => (
  <Tabs.Root value={value}>
    <Tabs.Contents data-testid="contents" ref={ref}>
      <Tabs.Content value="short">
        <div style={{ height: HEIGHTS.short }}>Short panel</div>
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
async function switchPanels(from: Panel, to: Panel, ref?: Ref<HTMLDivElement>) {
  await reloadMotion();
  const { rerender, getByTestId } = render(panelsOfTwoHeights(from, ref));
  const contents = getByTestId("contents");
  const tallPanel = page.getByText("Tall panel").element();
  const height = () => contents.getBoundingClientRect().height;
  const start = await waitForStable(height);
  const tallLeftBefore = tallPanel.getBoundingClientRect().left;

  rerender(panelsOfTwoHeights(to, ref));
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
});

describe("Tabs refs with Motion", () => {
  it("gives a ref on Tabs.Contents the container and still slides and resizes", async () => {
    const ref = createRef<HTMLDivElement>();
    const { contents, start, end, heights, tallLeftBefore, tallLeftAfter } = await switchPanels(
      "short",
      "tall",
      ref,
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
