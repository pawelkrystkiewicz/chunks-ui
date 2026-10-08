import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { waitForStable } from "../../VisualTest.utils";
import { Button } from "../button";
import { Tooltip } from "./index";

/*
 * The arrow is a rotated square. Its centre must sit on the popup edge it points out of, so
 * half of it hides behind the popup and the other half forms the tip. The square scales with
 * `--spacing`, so its offset has to scale too.
 */

const SPACINGS_PX = [3, 4, 4.8, 6];
const SIDES = ["top", "right", "bottom", "left"] as const;
type Side = (typeof SIDES)[number];

/** `expect.closeTo` digits: |actual − expected| < 0.05px. */
const PRECISION = 1;

/** Signed distance from the popup edge facing the trigger to the arrow's centre (0 = on the edge). */
function arrowCentreOffset(side: Side, popup: DOMRect, arrow: DOMRect) {
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

afterEach(() => {
  document.documentElement.style.removeProperty("--spacing");
});

describe.each(SIDES)("Tooltip arrow geometry, side %s", (side) => {
  it.each(SPACINGS_PX)(
    "centres the arrow on the popup edge at --spacing: %spx",
    async (spacing) => {
      // The popup is portalled to <body>, so the spacing goes on the root element.
      document.documentElement.style.setProperty("--spacing", `${spacing}px`);
      const { getByTestId } = render(
        <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
          <Tooltip.Provider>
            <Tooltip.Root defaultOpen>
              <Tooltip.Trigger render={<Button variant="outlined" />}>Trigger</Tooltip.Trigger>
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
        </div>,
      );

      const offset = await waitForStable(() => {
        const arrow = getByTestId("arrow");
        return arrowCentreOffset(
          side,
          getByTestId("popup").getBoundingClientRect(),
          arrow.getBoundingClientRect(),
        );
      });

      expect(getByTestId("arrow").getAttribute("data-side")).toBe(side);
      expect(offset).toBeCloseTo(0, PRECISION);
    },
  );
});
