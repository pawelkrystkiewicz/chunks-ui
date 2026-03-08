import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Tabs", () => {
  test("horizontal", async ({ page }) => {
    await gotoFixture(page, "tabs/Horizontal");
    await expect(page.locator("#fixture")).toHaveScreenshot("tabs-horizontal.png");
  });

  test("vertical", async ({ page }) => {
    await gotoFixture(page, "tabs/Vertical");
    await expect(page.locator("#fixture")).toHaveScreenshot("tabs-vertical.png");
  });
});
