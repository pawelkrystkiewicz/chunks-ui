import { afterEach, describe, expect, it } from "vitest";
import { arrowPaddingIn } from "./arrow-padding";

// jsdom has no layout, but its getComputedStyle reflects inline styles: enough to feed the probe.
// It doesn't expand `border-radius` into its longhands, so a radius is set on each corner.
function build({
  radius,
  corners,
  width = "10px",
  arrow = true,
}: {
  radius?: string;
  corners?: Partial<CSSStyleDeclaration>;
  width?: string;
  arrow?: boolean;
}) {
  const positioner = document.createElement("div");
  // Base UI puts focus guards before the popup
  positioner.append(document.createElement("span"));
  const popup = document.createElement("div");
  if (radius) {
    for (const corner of [
      "borderTopLeftRadius",
      "borderTopRightRadius",
      "borderBottomRightRadius",
      "borderBottomLeftRadius",
    ] as const) {
      popup.style[corner] = radius;
    }
  }
  Object.assign(popup.style, corners);
  if (arrow) {
    const tip = document.createElement("div");
    tip.className = "PopupArrow";
    tip.style.width = width;
    popup.append(tip);
  }
  positioner.append(popup);
  document.body.append(positioner);
  return positioner;
}

describe("arrowPaddingIn", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("is the corner radius plus the foot's reach past the arrow's box", () => {
    expect(arrowPaddingIn(build({ radius: "8px" }))).toBeCloseTo(
      8 + (10 * (Math.SQRT2 - 1)) / 2,
      5,
    );
  });

  it("uses the largest of the four corners", () => {
    const positioner = build({
      corners: {
        borderTopLeftRadius: "2px",
        borderTopRightRadius: "4px",
        borderBottomRightRadius: "12px",
        borderBottomLeftRadius: "6px",
      },
    });
    expect(arrowPaddingIn(positioner)).toBeCloseTo(12 + 2.0711, 3);
  });

  it("counts the larger component of an elliptical corner", () => {
    expect(arrowPaddingIn(build({ radius: "8px 12px" }))).toBeCloseTo(12 + 2.0711, 3);
  });

  it("is undefined while the popup holds no arrow", () => {
    expect(arrowPaddingIn(build({ radius: "8px", arrow: false }))).toBeUndefined();
  });

  it("is undefined without layout, where the arrow has no width", () => {
    expect(arrowPaddingIn(build({ radius: "8px", width: "" }))).toBeUndefined();
  });
});
