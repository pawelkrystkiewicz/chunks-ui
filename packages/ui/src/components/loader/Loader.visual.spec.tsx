import { describe, it } from "vitest";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
import { Loader } from "./index";

const colors = ["current", "primary", "muted"] as const;

describe("Loader", () => {
  it("colors", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {colors.map((c) => (
          <Loader key={c} color={c} />
        ))}
      </div>,
    );
    pauseAnimations();
    await expect(fixture).toMatchScreenshot();
  });
});
