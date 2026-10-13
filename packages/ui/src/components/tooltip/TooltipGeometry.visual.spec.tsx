import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  arrowOverhang,
  LAYOUT_ROUNDING_PX,
  resetTheme,
  THEMES,
  waitForStable,
} from "../../VisualTest.utils";
import { Button } from "../button";
import { Tooltip } from "./index";

/*
 * The arrow is a rotated square. Its centre must sit on the popup edge it points out of, so
 * half of it hides behind the popup and the other half forms the tip. The square scales with
 * `--spacing`, so its offset has to scale too, and so does the popup's distance from the
 * trigger, or the tip runs into the trigger.
 */

const SPACINGS_PX = [3, 4, 4.8, 6];
const PHYSICAL_SIDES = ["top", "right", "bottom", "left"] as const;
const LOGICAL_SIDES = ["inline-start", "inline-end"] as const;
type PhysicalSide = (typeof PHYSICAL_SIDES)[number];
type Side = PhysicalSide | (typeof LOGICAL_SIDES)[number];
type Direction = "ltr" | "rtl";

/** Physical sides once, logical sides in both directions (they resolve differently in each). */
const CASES: { side: Side; dir: Direction }[] = [
  ...PHYSICAL_SIDES.map((side) => ({ side, dir: "ltr" as const })),
  ...LOGICAL_SIDES.flatMap((side) => [
    { side, dir: "ltr" as const },
    { side, dir: "rtl" as const },
  ]),
];

/** Where a side renders: `inline-start` is the left in LTR and the right in RTL. */
function physicalSide(side: Side, dir: Direction): PhysicalSide {
  if (side === "inline-start") return dir === "ltr" ? "left" : "right";
  if (side === "inline-end") return dir === "ltr" ? "right" : "left";
  return side;
}

/**
 * Tip-to-trigger gap in spacing units: the popup sits 2 units from the trigger, and the arrow
 * (a 2.5-unit square standing on a corner) reaches half its diagonal, 2.5 / √2 units, past it.
 */
const TIP_GAP_UNITS = 2 - 2.5 / Math.SQRT2;

/** `expect.closeTo` digits: |actual − expected| < 0.05px. */
const PRECISION = 1;

/** Floating UI rounds the popup position to whole device pixels (DPR 1 here). */
const POSITION_ROUNDING_PX = 0.5;

/** How far the arrow's centre lies past the popup edge, toward the trigger (0 = on the edge). */
function centrePastEdge(side: PhysicalSide, popup: DOMRect, arrow: DOMRect) {
  // Rotation keeps the centre, so the bounding box centre is the square's centre.
  const centreX = arrow.left + arrow.width / 2;
  const centreY = arrow.top + arrow.height / 2;
  switch (side) {
    case "top":
      return centreY - popup.bottom;
    case "bottom":
      return popup.top - centreY;
    case "left":
      return centreX - popup.right;
    case "right":
      return popup.left - centreX;
  }
}

/** Space between the arrow tip (the bounding box edge facing the trigger) and the trigger. */
function tipGap(side: PhysicalSide, arrow: DOMRect, trigger: DOMRect) {
  switch (side) {
    case "top":
      return trigger.top - arrow.bottom;
    case "bottom":
      return arrow.top - trigger.bottom;
    case "left":
      return trigger.left - arrow.right;
    case "right":
      return arrow.left - trigger.right;
  }
}

/** Renders an open tooltip on `side` at `--spacing: spacing px` and measures it once settled. */
async function measureTooltip(side: Side, spacing: number, dir: Direction) {
  // The popup is portalled to <body>, so the spacing and the direction go on the root element.
  // Base UI needs the direction too, to resolve logical sides.
  document.documentElement.style.setProperty("--spacing", `${spacing}px`);
  document.documentElement.dir = dir;
  const { getByTestId } = render(
    <DirectionProvider direction={dir}>
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger data-testid="trigger" render={<Button variant="outlined" />}>
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side={side}>
                <Tooltip.Popup data-testid="popup">
                  <Tooltip.Arrow data-testid="arrow" />
                  Tooltip content
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </DirectionProvider>,
  );

  const physical = physicalSide(side, dir);
  const measured = await waitForStable(() => {
    const arrow = getByTestId("arrow").getBoundingClientRect();
    return {
      centrePastEdge: centrePastEdge(physical, getByTestId("popup").getBoundingClientRect(), arrow),
      tipGap: tipGap(physical, arrow, getByTestId("trigger").getBoundingClientRect()),
    };
  });
  expect(getByTestId("arrow").getAttribute("data-side")).toBe(side);
  return measured;
}

afterEach(() => {
  document.documentElement.style.removeProperty("--spacing");
  document.documentElement.removeAttribute("dir");
});

describe.each(CASES)("Tooltip arrow geometry, side $side ($dir)", ({ side, dir }) => {
  it.each(SPACINGS_PX)(
    "centres the arrow on the popup edge at --spacing: %spx",
    async (spacing) => {
      const measured = await measureTooltip(side, spacing, dir);
      expect(measured.centrePastEdge).toBeCloseTo(0, PRECISION);
    },
  );

  it.each(SPACINGS_PX)(
    "keeps a gap between the arrow tip and the trigger at --spacing: %spx",
    async (spacing) => {
      const measured = await measureTooltip(side, spacing, dir);
      expect(measured.tipGap).toBeGreaterThanOrEqual(0);
      expect(Math.abs(measured.tipGap - TIP_GAP_UNITS * spacing)).toBeLessThanOrEqual(
        POSITION_ROUNDING_PX,
      );
    },
  );
});

type Align = "start" | "end";

/**
 * Opens a one-line tooltip on `side` of a 20px trigger, aligned to its `align` edge. The trigger's
 * centre is nearer that end of the popup than the arrow may come, so Base UI holds the arrow
 * `arrowPadding` from the end, or as near the middle as the popup's length lets it. Returns the
 * open popup and its arrow, once settled.
 */
async function openNearCorner(side: Side, align: Align, dir: Direction, arrowPadding?: number) {
  document.documentElement.dir = dir;
  const result = render(
    <DirectionProvider direction={dir}>
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger aria-label="Trigger" style={{ width: 20, height: 20, padding: 0 }} />
          <Tooltip.Portal>
            <Tooltip.Positioner side={side} align={align} arrowPadding={arrowPadding}>
              <Tooltip.Popup data-testid="popup">
                <Tooltip.Arrow data-testid="arrow" />
                Tooltip content
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </DirectionProvider>,
  );
  const arrow = result.getByTestId("arrow");
  const popup = result.getByTestId("popup");
  await waitForStable(() => JSON.stringify([arrow, popup].map((el) => el.getBoundingClientRect())));
  expect(arrow.getAttribute("data-side")).toBe(side);
  return { ...result, arrow, popup };
}

/**
 * With `openNearCorner` on the top or bottom `side`, measures along the arrow's edge the distance
 * from the popup's `align` end to the nearer end of the arrow's foot (its widest point). Also
 * returns the popup's corner radius and the arrow's overhang.
 */
async function footNearCorner(side: "top" | "bottom", align: Align, arrowPadding?: number) {
  const { arrow, popup, unmount } = await openNearCorner(side, align, "ltr", arrowPadding);
  const a = arrow.getBoundingClientRect();
  const p = popup.getBoundingClientRect();
  const foot = align === "start" ? a.left - p.left : p.right - a.right;
  const radius = Number.parseFloat(getComputedStyle(popup).borderTopLeftRadius);
  const overhang = arrowOverhang(arrow);
  unmount();
  return { foot, radius, overhang };
}

// Bottom only: top shares the code path. Left and right are below: a one-line tooltip there is
// shorter than the foot and two full corners
const NEAR_CORNER = (["start", "end"] as const).flatMap((align) =>
  THEMES.map((theme) => ({ side: "bottom" as const, align, ...theme })),
);

describe.each(NEAR_CORNER)(
  "Tooltip arrow, side $side, align $align, small trigger, $theme",
  ({ side, align, vars }) => {
    afterEach(() => resetTheme(vars));

    it("keeps its foot off the popup's rounded corner", async () => {
      applyTheme(vars);
      const { foot, radius } = await footNearCorner(side, align);
      // The corner curves this far along the edge; past it, the edge is straight
      expect(foot).toBeGreaterThanOrEqual(radius - LAYOUT_ROUNDING_PX);
      // No border or margin: the foot starts where the corner ends. At the end, Floating UI
      // measures the popup by its `clientWidth`, which rounds to a whole pixel: up to half a pixel.
      const rounding = align === "end" ? POSITION_ROUNDING_PX : LAYOUT_ROUNDING_PX;
      expect(foot).toBeLessThanOrEqual(radius + rounding);
    });
  },
);

describe("Tooltip.Positioner arrowPadding", () => {
  it("holds an arrow near the corner the padding it is given from the popup's end", async () => {
    const { foot, overhang } = await footNearCorner("bottom", "start", 16);
    expect(Math.abs(foot - (16 - overhang))).toBeLessThanOrEqual(LAYOUT_ROUNDING_PX);
  });
});

type Corner =
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius";

/**
 * How far `popup`'s `corner` curves along its left or right edge: the corner's vertical radius as
 * drawn. The computed value keeps a percentage of the height (`min(8px, 50% - 8px)`), so a probe
 * resolves it against the popup's height.
 */
function verticalRadius(popup: Element, corner: Corner) {
  // "<horizontal> <vertical>", or one value for both; a space inside a function separates nothing
  const values = getComputedStyle(popup)[corner].match(/[^\s(]+(\([^)]*\))?/g) ?? [];
  const box = document.createElement("div");
  box.style.height = `${popup.getBoundingClientRect().height}px`;
  const probe = document.createElement("div");
  probe.style.height = values.at(-1) ?? "0px";
  box.append(probe);
  document.body.append(box);
  const radius = probe.getBoundingClientRect().height;
  box.remove();
  // A radius the probe rejects would measure 0 and let every bound above it pass
  expect(radius).toBeGreaterThan(0);
  return radius;
}

/** The corners at the ends of the left or right edge the arrow stands on, when on `side` */
const ARROW_EDGE_CORNERS: Record<"left" | "right", [top: Corner, bottom: Corner]> = {
  // The popup is left of the trigger, and the arrow on its right edge
  left: ["borderTopRightRadius", "borderBottomRightRadius"],
  right: ["borderTopLeftRadius", "borderBottomLeftRadius"],
};

// W104: one line of text is about 24px tall, less than the arrow's foot and two 8px corners, so
// Floating UI caps the padding at the popup's middle, less 1px
const ONE_LINE_SIDES = CASES.filter(({ side, dir }) => {
  const physical = physicalSide(side, dir);
  return physical === "left" || physical === "right";
}).flatMap((c) =>
  (["start", "end"] as const).flatMap((align) =>
    THEMES.map((theme) => ({ ...c, align, ...theme })),
  ),
);

describe.each(ONE_LINE_SIDES)(
  "One-line Tooltip arrow, side $side ($dir), align $align, small trigger, $theme",
  ({ side, dir, align, vars }) => {
    afterEach(() => resetTheme(vars));

    it("stands its foot on the straight part of the popup's edge", async () => {
      applyTheme(vars);
      const { arrow, popup } = await openNearCorner(side, align, dir);
      const a = arrow.getBoundingClientRect();
      const p = popup.getBoundingClientRect();
      const physical = physicalSide(side, dir) as "left" | "right";
      const [top, bottom] = ARROW_EDGE_CORNERS[physical];
      // `verticalRadius` rejects a radius of 0.
      expect(a.top - p.top).toBeGreaterThanOrEqual(verticalRadius(popup, top) - LAYOUT_ROUNDING_PX);
      expect(p.bottom - a.bottom).toBeGreaterThanOrEqual(
        verticalRadius(popup, bottom) - LAYOUT_ROUNDING_PX,
      );
      // Upper bound: the gap Floating UI computes. The popup is too short for the padding (a corner
      // radius, and the arrow's overhang), so it holds the arrow at the middle, less 1px: the padding
      // is capped at half the popup's height less half the arrow's, less 1px.
      const arrowSize = Number.parseFloat(getComputedStyle(arrow).width);
      const overhang = arrowOverhang(arrow);
      // The larger radius of a corner, in px; `min(8px, 50% - 8px)` is a function, not a length
      const lengths = (Object.keys(ARROW_EDGE_CORNERS) as Array<keyof typeof ARROW_EDGE_CORNERS>)
        .flatMap((edge) => ARROW_EDGE_CORNERS[edge])
        .flatMap((corner) =>
          getComputedStyle(popup)
            [corner].split(/\s+/)
            .filter((v) => /^[\d.]+px$/.test(v)),
        );
      const padding = Math.max(0, ...lengths.map(Number.parseFloat)) + overhang;
      const cap = popup.clientHeight / 2 - arrowSize / 2 - 1;
      expect(padding, "the padding is too much for a one-line popup").toBeGreaterThan(cap);
      // The arrow's foot stands out `overhang` past its box; the box is `cap` from the end
      const nearGap = align === "start" ? a.top - p.top : p.bottom - a.bottom;
      expect(Math.abs(nearGap - (cap - overhang))).toBeLessThanOrEqual(POSITION_ROUNDING_PX);
    });
  },
);
