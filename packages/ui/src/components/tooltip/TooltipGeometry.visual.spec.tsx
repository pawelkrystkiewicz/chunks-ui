import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { waitForStable } from "../../VisualTest.utils";
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
