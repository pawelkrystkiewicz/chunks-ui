import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { NumberField } from "./index";

describe("NumberField", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <NumberField.Root defaultValue={42} max={100} min={0}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <NumberField.Root defaultValue={42} disabled max={100} min={0}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
