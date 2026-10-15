import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { renderFixture } from "../../VisualTest.utils";
import { ClearButton } from "./index";

describe("ClearButton", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(<ClearButton onClick={() => {}} />);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on a disabled button", () => {
    const { getByRole } = render(<ClearButton disabled />);
    const { cursor, pointerEvents } = getComputedStyle(getByRole("button", { name: "Clear" }));
    expect({ cursor, pointerEvents }).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
  });

  it("keeps its rest colours and size under the pointer when disabled", async () => {
    const { getByRole } = render(<ClearButton disabled />);
    const button = getByRole("button", { name: "Clear" });
    const looks = () => {
      const { color, backgroundColor, scale } = getComputedStyle(button);
      return { color, backgroundColor, scale };
    };
    const rest = looks();
    await userEvent.hover(button);
    // The hover styles would fade in: wait for any transition the hover started
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await Promise.all(button.getAnimations().map((animation) => animation.finished));
    expect(looks()).toEqual(rest);
  });
});
