import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Calendar } from "./index";

describe("Calendar", () => {
  it("with selected date", async () => {
    const { fixture } = await renderFixture(<Calendar value={new Date(2026, 2, 15)} />);
    await expect(fixture).toMatchScreenshot();
  });

  it("no selection", async () => {
    const { fixture } = await renderFixture(<Calendar />);
    await expect(fixture).toMatchScreenshot();
  });
});
