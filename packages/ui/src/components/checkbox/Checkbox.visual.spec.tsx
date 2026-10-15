import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
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

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the edge
  it("focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <Checkbox.Root aria-label="Focused">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    const checkbox = getByRole("checkbox");
    checkbox.focus();
    expect(checkbox.matches(":focus-visible")).toBe(true);
    await expect(fixture).toMatchScreenshot();
  });
});
