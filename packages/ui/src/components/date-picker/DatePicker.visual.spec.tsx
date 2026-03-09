import { describe, it } from "vitest";
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
