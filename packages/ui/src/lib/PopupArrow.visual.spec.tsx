import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { Button } from "../components/button";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { describeMotionPaths, eachPaintedFrame, waitForStable } from "../VisualTest.utils";
import { reloadMotion } from "./use-motion";

/*
 * Popover.Arrow and Menu.Arrow draw the same arrow: a square in the popup's colours, turned so
 * one corner points at the trigger. It must reach out of the popup toward the trigger without
 * touching it, and line up with the trigger's centre.
 */

const PHYSICAL_SIDES = ["top", "right", "bottom", "left"] as const;
const LOGICAL_SIDES = ["inline-start", "inline-end"] as const;
type PhysicalSide = (typeof PHYSICAL_SIDES)[number];
type Side = PhysicalSide | (typeof LOGICAL_SIDES)[number];
type Direction = "ltr" | "rtl";
type Kind = "Popover" | "Menu";

/** Physical sides once, logical sides in both directions (they resolve differently in each). */
const SIDES: { side: Side; dir: Direction }[] = [
  ...PHYSICAL_SIDES.map((side) => ({ side, dir: "ltr" as const })),
  ...LOGICAL_SIDES.flatMap((side) => [
    { side, dir: "ltr" as const },
    { side, dir: "rtl" as const },
  ]),
];

const KINDS: Kind[] = ["Popover", "Menu"];

const CASES = KINDS.flatMap((kind) => SIDES.map((c) => ({ kind, ...c })));

/** Where a side renders: `inline-start` is the left in LTR and the right in RTL. */
function physicalSide(side: Side, dir: Direction): PhysicalSide {
  if (side === "inline-start") return dir === "ltr" ? "left" : "right";
  if (side === "inline-end") return dir === "ltr" ? "right" : "left";
  return side;
}

/** Floating UI rounds the popup position to whole device pixels (DPR 1 here). */
const POSITION_ROUNDING_PX = 0.5;

/** An arrowed popup of `kind` on `side`, opened by default or by clicking "Trigger". */
function arrowed(kind: Kind, side: Side, dir: Direction, defaultOpen: boolean): ReactNode {
  const trigger = <Button variant="outlined" />;
  const popup =
    kind === "Popover" ? (
      <Popover.Root defaultOpen={defaultOpen}>
        <Popover.Trigger data-testid="trigger" render={trigger}>
          Trigger
        </Popover.Trigger>
        <Popover.Content side={side} data-testid="popup">
          <Popover.Arrow data-testid="arrow" />
          Popover
        </Popover.Content>
      </Popover.Root>
    ) : (
      <Menu.Root defaultOpen={defaultOpen}>
        <Menu.Trigger data-testid="trigger" render={trigger}>
          Trigger
        </Menu.Trigger>
        <Menu.Content side={side} data-testid="popup">
          <Menu.Arrow data-testid="arrow" />
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    );
  // Base UI needs the direction to resolve logical sides, and the CSS needs it on the root
  // element, because the popup is portalled to <body>.
  document.documentElement.dir = dir;
  return (
    <DirectionProvider direction={dir}>
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>{popup}</div>
    </DirectionProvider>
  );
}

/** How far the arrow's tip reaches past the popup's edge, and the gap left to the trigger. */
function mainAxis(side: PhysicalSide, popup: DOMRect, arrow: DOMRect, trigger: DOMRect) {
  switch (side) {
    case "top":
      return { reach: arrow.bottom - popup.bottom, tipGap: trigger.top - arrow.bottom };
    case "bottom":
      return { reach: popup.top - arrow.top, tipGap: arrow.top - trigger.bottom };
    case "left":
      return { reach: arrow.right - popup.right, tipGap: trigger.left - arrow.right };
    case "right":
      return { reach: popup.left - arrow.left, tipGap: arrow.left - trigger.right };
  }
}

/** Cross-axis distance between the arrow's centre and the trigger's centre. */
function offCentre(side: PhysicalSide, arrow: DOMRect, trigger: DOMRect) {
  const vertical = side === "top" || side === "bottom";
  return vertical
    ? arrow.left + arrow.width / 2 - (trigger.left + trigger.width / 2)
    : arrow.top + arrow.height / 2 - (trigger.top + trigger.height / 2);
}

/**
 * Whether the page shows the arrow halfway from its centre toward `side`'s trigger (`toward`) or
 * away from it. Only the tip half is drawn, and nothing may clip it.
 */
function arrowShows(arrow: Element, side: PhysicalSide, toward: boolean) {
  const box = arrow.getBoundingClientRect();
  // From the centre, a quarter of the box toward the trigger
  const step = {
    top: { x: 0, y: box.height / 4 },
    bottom: { x: 0, y: -box.height / 4 },
    left: { x: box.width / 4, y: 0 },
    right: { x: -box.width / 4, y: 0 },
  }[side];
  const sign = toward ? 1 : -1;
  const x = box.left + box.width / 2 + sign * step.x;
  const y = box.top + box.height / 2 + sign * step.y;
  return document.elementFromPoint(x, y) === arrow;
}

async function measure(kind: Kind, side: Side, dir: Direction) {
  render(arrowed(kind, side, dir, true));
  const physical = physicalSide(side, dir);
  const arrow = await screen.findByTestId("arrow");
  const measured = await waitForStable(() => {
    const a = arrow.getBoundingClientRect();
    const t = screen.getByTestId("trigger").getBoundingClientRect();
    return {
      area: a.width * a.height,
      ...mainAxis(physical, screen.getByTestId("popup").getBoundingClientRect(), a, t),
      offCentre: offCentre(physical, a, t),
    };
  });
  expect(arrow.getAttribute("data-side")).toBe(side);
  return measured;
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe.each(CASES)("$kind arrow, side $side ($dir)", ({ kind, side, dir }) => {
  it("reaches out of the popup toward the trigger without touching it", async () => {
    const { area, reach, tipGap } = await measure(kind, side, dir);
    expect(area).toBeGreaterThan(0);
    expect(reach).toBeGreaterThan(0);
    expect(tipGap).toBeGreaterThanOrEqual(0);
  });

  it("points at the trigger's centre", async () => {
    const { offCentre } = await measure(kind, side, dir);
    expect(Math.abs(offCentre)).toBeLessThanOrEqual(POSITION_ROUNDING_PX);
  });

  it("draws its tip half, toward the trigger, and not the half inside the popup", async () => {
    await measure(kind, side, dir);
    const arrow = screen.getByTestId("arrow");
    const physical = physicalSide(side, dir);
    expect(arrowShows(arrow, physical, true)).toBe(true);
    expect(arrowShows(arrow, physical, false)).toBe(false);
  });
});

describe.each(KINDS)("%s.Arrow colours", (kind) => {
  it("fills with the popup's background and edges two sides with its border", async () => {
    render(arrowed(kind, "bottom", "ltr", true));
    const arrow = getComputedStyle(await screen.findByTestId("arrow"));
    const popup = getComputedStyle(screen.getByTestId("popup"));
    expect(arrow.backgroundColor).toBe(popup.backgroundColor);

    const edges = (["Top", "Right", "Bottom", "Left"] as const)
      .filter((edge) => arrow[`border${edge}Width`] !== "0px")
      .map((edge) => ({
        width: arrow[`border${edge}Width`],
        color: arrow[`border${edge}Color`],
      }));
    // The other two sides face into the popup, where a line would cut the arrow off from it
    expect(edges).toEqual([
      { width: popup.borderTopWidth, color: popup.borderTopColor },
      { width: popup.borderTopWidth, color: popup.borderTopColor },
    ]);
  });
});

/**
 * Records, on each painted frame from the click on, whether the arrow's tip shows. Frames before
 * Base UI has placed the arrow (no inline position yet) are left out.
 */
async function tipOnEachFrame(kind: Kind) {
  render(arrowed(kind, "bottom", "ltr", false));
  const frames = eachPaintedFrame(() => {
    const arrow = document.querySelector<HTMLElement>('[data-testid="arrow"]');
    if (!arrow?.style.left) return null;
    return arrowShows(arrow, "bottom", true);
  }, 40);
  await userEvent.click(screen.getByTestId("trigger"));
  return (await frames).filter((shows) => shows !== null);
}

describe.each(KINDS)("%s.Arrow while the popup opens", (kind) => {
  describeMotionPaths(kind, () => {
    it("shows the tip on every frame", async () => {
      const shows = await tipOnEachFrame(kind);
      expect(shows.length).toBeGreaterThan(0);
      expect(shows).not.toContain(false);
    });
  });

  describe("without Motion", () => {
    afterEach(async () => {
      await commands.emulateMedia({ reducedMotion: "reduce" });
      await reloadMotion();
    });

    it("shows the tip on every frame of the CSS transition", async () => {
      // Motion never arrives, and reduced motion is off
      void reloadMotion(new Promise(() => {}));
      await commands.emulateMedia({ reducedMotion: "no-preference" });
      await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
      const shows = await tipOnEachFrame(kind);
      expect(shows.length).toBeGreaterThan(0);
      expect(shows).not.toContain(false);
    });
  });
});

/** The arrow's reach at the default `--spacing` of 4px: 1.75 units. */
const REACH_PX = 1.75 * 4;

describe.each(KINDS)("%s with an arrow, without Motion", (kind) => {
  afterEach(async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await reloadMotion();
  });

  it("moves straight to a new side, without sliding its margin across", async () => {
    // CSS transition fallback: Motion never arrives, and reduced motion is off
    void reloadMotion(new Promise(() => {}));
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
    const { rerender } = render(arrowed(kind, "bottom", "ltr", true));
    const popup = await screen.findByTestId("popup");
    // The opening fade and scale have finished
    await waitForStable(() => JSON.stringify(popup.getBoundingClientRect()));

    rerender(arrowed(kind, "top", "ltr", true));
    const margins = await eachPaintedFrame(() => getComputedStyle(popup).marginBottom, 20);

    expect(margins.at(-1)).toBe(`${REACH_PX}px`);
    expect(margins.filter((margin) => margin !== "0px" && margin !== `${REACH_PX}px`)).toEqual([]);
  });
});
