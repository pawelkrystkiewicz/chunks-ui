import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Separator", () => {
  test("horizontal", async ({ page }) => {
    await gotoFixture(page, "separator/Horizontal");
    await expect(page.locator("#fixture")).toHaveScreenshot("separator-horizontal.png");
  });

  test("vertical", async ({ page }) => {
    await gotoFixture(page, "separator/Vertical");
    await expect(page.locator("#fixture")).toHaveScreenshot("separator-vertical.png");
  });
});
