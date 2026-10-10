import { describe, it } from "vitest";
import { renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
import { Separator } from "./index";

describe("Separator", () => {
  it("horizontal", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 300 }}>
        <p className="mb-2 text-sm">Above</p>
        <Separator />
        <p className="mt-2 text-sm">Below</p>
      </div>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  it("vertical", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40 }}>
        <span className="text-sm">Left</span>
        <Separator orientation="vertical" />
        <span className="text-sm">Right</span>
      </div>,
    );
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });
});
