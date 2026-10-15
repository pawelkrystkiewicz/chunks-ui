import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
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

  it("keeps its rest colours and size under the pointer, hovered and pressed, when disabled", async () => {
    const { getByRole } = render(<ClearButton disabled />);
    const button = getByRole("button", { name: "Clear" });
    const looks = () => {
      const { color, backgroundColor, scale } = getComputedStyle(button);
      // `none` and `1` are the same size
      return { color, backgroundColor, scale: scale === "none" ? 1 : Number(scale) };
    };
    const rest = looks();
    await userEvent.hover(button);
    expect(looks()).toEqual(rest);
    // Chromium applies :active to a disabled button, so the press scale must stay off as well
    await commands.mouseDown();
    try {
      expect(looks()).toEqual(rest);
    } finally {
      await commands.mouseUp();
    }
  });
});
