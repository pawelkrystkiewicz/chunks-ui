import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("ClearButton", () => {
  test("default", async ({ page }) => {
    await gotoFixture(page, "clear-button/Default");
    await expect(page.locator("#fixture")).toHaveScreenshot("clear-button-default.png");
  });
});
