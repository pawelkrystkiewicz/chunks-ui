import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { ClearButton } from "./index";

describe("ClearButton", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(<ClearButton onClick={() => {}} />);
    await expect(fixture).toMatchScreenshot();
  });
});
