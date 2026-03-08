import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Avatar } from "./index";

const shapes = ["circle", "rounded", "square"] as const;

describe("Avatar", () => {
  it("shapes", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {shapes.map((shape) => (
          <Avatar key={shape} fallback="AB" shape={shape} />
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("sizes", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Avatar fallback="S" size={24} />
        <Avatar fallback="M" size={40} />
        <Avatar fallback="L" size={56} />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
