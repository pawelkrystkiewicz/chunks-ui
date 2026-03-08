import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Switch } from "./index";

describe("Switch", () => {
  it("states", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root>
            <Switch.Thumb />
          </Switch.Root>
          Off
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
          On
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch.Root disabled>
            <Switch.Thumb />
          </Switch.Root>
          Disabled
        </span>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
