import { describe, it } from "vitest";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
import { Loader } from "./index";

describe("Loader", () => {
  it("inherits color from context", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ color: "var(--primary)" }}>
          <Loader />
        </span>
        <span style={{ color: "var(--destructive)" }}>
          <Loader />
        </span>
        <span style={{ color: "var(--muted-foreground)" }}>
          <Loader />
        </span>
      </div>,
    );
    pauseAnimations();
    await expect(fixture).toMatchScreenshot();
  });
});
