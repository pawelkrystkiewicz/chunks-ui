import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { ToggleGroup } from "./index";

describe("ToggleGroup", () => {
  it("single selection", async () => {
    const { fixture } = await renderFixture(
      <ToggleGroup.Root defaultValue={["center"]}>
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with disabled item", async () => {
    const { fixture } = await renderFixture(
      <ToggleGroup.Root defaultValue={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b" disabled>
          B
        </ToggleGroup.Item>
        <ToggleGroup.Item value="c">C</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the item, which reaches into the
  // root's 4px padding and 2px over the neighbouring items, past the 2px gap
  it("pressed item focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <ToggleGroup.Root defaultValue={["center"]}>
        <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
        <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
        <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const pressed = getByRole("button", { name: "Center", pressed: true });
    pressed.focus();
    expect(pressed.matches(":focus-visible")).toBe(true);
    await expect(fixture).toMatchScreenshot();
  });
});
