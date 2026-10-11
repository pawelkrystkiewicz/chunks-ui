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
});
