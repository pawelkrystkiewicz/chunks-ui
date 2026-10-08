import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { renderFixture } from "../../VisualTest.utils";
import { DatePicker } from "./index";

describe("DatePicker", () => {
  it("with value", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 220 }}>
        <DatePicker value={new Date(2026, 2, 15)} />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("empty", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 220 }}>
        <DatePicker />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});

// Lives in the browser suite, not jsdom: only a real browser runs the popup's exit transition,
// which keeps it mounted, with focus on the day, for ~300ms after Escape. A check made at a fixed
// delay races that transition, so every wait below polls. No screenshots are taken.
describe("DatePicker keyboard", () => {
  it("opens on the selected day, and Escape closes and refocuses the trigger every time", async () => {
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} />);
    const trigger = page.getByRole("button", { name: "March 15, 2026", exact: true });
    for (let cycle = 0; cycle < 6; cycle++) {
      if (cycle % 2 === 0) await trigger.click();
      else await userEvent.keyboard("{Enter}");
      await expect
        .element(page.getByRole("button", { name: "Sunday, March 15, 2026" }))
        .toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect
        .element(page.getByRole("button", { name: "Sunday, March 22, 2026" }))
        .toHaveFocus();
      // Let the open transition finish so Escape takes the full exit-transition path.
      await expect.poll(() => document.getAnimations().length).toBe(0);
      await userEvent.keyboard("{Escape}");
      // The close itself is synchronous; only the unmount waits for the exit transition.
      expect(trigger.element()).toHaveAttribute("aria-expanded", "false");
      await expect.element(trigger).toHaveFocus();
      await expect.element(page.getByRole("grid")).not.toBeInTheDocument();
    }
  });
});
