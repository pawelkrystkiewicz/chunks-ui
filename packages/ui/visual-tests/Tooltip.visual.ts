import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Tooltip", () => {
  test("open", async ({ page }) => {
    await gotoFixture(page, "tooltip/Open");
    await expect(page).toHaveScreenshot("tooltip-open.png");
  });
});
