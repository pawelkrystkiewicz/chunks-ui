import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { reloadMotion } from "../../lib/use-motion";
import { eachPaintedFrame, insetsWithin } from "../../VisualTest.utils";
import { Checkbox } from "./index";

// Runs with reduced motion off, so Motion springs the indicator. Checkbox.Root does not clip its
// content: a clip would also cut the `touch-target` area. So the indicator, overshoot included,
// must stay inside the box's border on every frame.

/** Checkbox.Root's border width, in CSS px */
const BORDER = 1;
/** About half a second: the micro spring comes to rest within it */
const FRAMES = 30;

describe("Checkbox indicator with Motion", () => {
  beforeAll(() => reloadMotion());

  it("stays inside the box's border on every frame of the spring", async () => {
    const ui = (indeterminate: boolean) => (
      <Checkbox.Root aria-label="Accept" indeterminate={indeterminate}>
        <Checkbox.Indicator data-testid="indicator" />
      </Checkbox.Root>
    );
    const { getByRole, getByTestId, rerender } = render(ui(false));
    const box = getByRole("checkbox");
    const indicator = getByTestId("indicator");
    /** The indicator's smallest inset within the box, on each frame */
    const frames = () =>
      eachPaintedFrame(() => Math.min(...Object.values(insetsWithin(box, indicator))), FRAMES);

    // Motion hides the unchecked indicator in its first frame; a click before that skips the spring
    await expect.poll(() => getComputedStyle(indicator).opacity).toBe("0");
    box.click();
    const checking = await frames();
    box.click();
    const unchecking = await frames();
    rerender(ui(true));
    const mixed = await frames();

    // The spring ran: the indicator grew while it was checked
    expect(Math.max(...checking)).toBeGreaterThan(Math.min(...checking));
    expect(Math.min(...checking, ...unchecking, ...mixed)).toBeGreaterThanOrEqual(BORDER);
  });
});
