import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Popover", () => {
  test("open", async ({ page }) => {
    await gotoFixture(page, "popover/Open");
    await expect(page).toHaveScreenshot("popover-open.png");
  });

  test("trigger", async ({ page }) => {
    await gotoFixture(page, "popover/Trigger");
    await expect(page.locator("#fixture")).toHaveScreenshot("popover-trigger.png");
  });
});
