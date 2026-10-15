import { describe, it } from "vitest";
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
});
