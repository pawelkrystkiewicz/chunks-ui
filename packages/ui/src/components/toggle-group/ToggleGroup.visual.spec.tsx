import { describe, expect, it } from "vitest";
import { focusVisible, renderFixture } from "../../VisualTest.utils";
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
    focusVisible(getByRole("button", { name: "Center", pressed: true }));
    await expect(fixture).toMatchScreenshot();
  });

  // In a `multiple` group a pressed item has an opaque background. The next sibling paints over
  // the one before it at the same z-index, so the focused item rises above it: its ring shows
  // whole on the side the pressed neighbour would otherwise cover.
  it("multiple, focused item before a pressed one", async () => {
    const { fixture, getByRole } = await renderFixture(
      <ToggleGroup.Root multiple defaultValue={["italic"]}>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    focusVisible(getByRole("button", { name: "Bold", pressed: false }));
    await expect(fixture).toMatchScreenshot();
  });
});
