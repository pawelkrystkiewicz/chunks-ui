import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Select", () => {
  test("closed", async ({ page }) => {
    await gotoFixture(page, "select/Closed");
    await expect(page.locator("#fixture")).toHaveScreenshot("select-closed.png");
  });

  test("open", async ({ page }) => {
    await gotoFixture(page, "select/Open");
    await expect(page).toHaveScreenshot("select-open.png");
  });
});
