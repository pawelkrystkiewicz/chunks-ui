import { describe, it } from "vitest";
import { pauseAnimations, renderFixture } from "../../VisualTest.utils";
import { Progress } from "./index";

describe("Progress", () => {
  it("determinate", async () => {
    const { fixture } = await renderFixture(
      <Progress.Root value={65} max={100}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("indeterminate", async () => {
    const { fixture } = await renderFixture(
      <Progress.Root value={null}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );
    pauseAnimations();
    await expect(fixture).toMatchScreenshot();
  });
});
