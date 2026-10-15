import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { focusVisible, renderFixture } from "../../VisualTest.utils";
import { Checkbox } from "./index";

describe("Checkbox", () => {
  it("states", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Checkbox.Root>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Unchecked
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Checkbox.Root defaultChecked>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Checked
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Checkbox.Root indeterminate>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Indeterminate
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Checkbox.Root disabled>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Disabled
        </span>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <Checkbox.Root aria-label="Focused">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const checkbox = getByRole("checkbox");
    focusVisible(checkbox);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on a disabled checkbox, and a click does not check it", async () => {
    const { getByRole } = render(
      <div>
        <input aria-label="Name" />
        <Checkbox.Root aria-label="Enabled">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Checkbox.Root aria-label="Disabled" disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
      </div>,
    );
    const looks = (name: string) => {
      const { cursor, pointerEvents } = getComputedStyle(getByRole("checkbox", { name }));
      return { cursor, pointerEvents };
    };
    expect(looks("Disabled")).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
    expect(looks("Enabled").cursor).not.toBe("not-allowed");

    const input = getByRole("textbox", { name: "Name" });
    input.focus();
    // force: Playwright refuses to click a disabled element, a user can
    await page.elementLocator(getByRole("checkbox", { name: "Disabled" })).click({ force: true });
    expect(getByRole("checkbox", { name: "Disabled" }).getAttribute("aria-checked")).toBe("false");
    expect(document.activeElement).toBe(input);
  });
});
