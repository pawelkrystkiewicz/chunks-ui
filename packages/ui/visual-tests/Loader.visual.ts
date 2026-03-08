import { expect, test } from "@playwright/test";
import { gotoFixture, pauseAnimations } from "./VisualTest.utils";

test.describe("Loader", () => {
  test("colors", async ({ page }) => {
    await gotoFixture(page, "loader/Colors");
    await pauseAnimations(page);
    await expect(page.locator("#fixture")).toHaveScreenshot("loader-colors.png");
  });
});
