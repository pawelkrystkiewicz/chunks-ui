import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Textarea } from "./index";

describe("Textarea", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <Textarea placeholder="Enter text..." style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with value", async () => {
    const { fixture } = await renderFixture(
      <Textarea defaultValue={"Hello world\nSecond line"} style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <Textarea placeholder="Disabled" disabled style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
