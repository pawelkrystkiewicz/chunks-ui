import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Combobox", () => {
  test("closed", async ({ page }) => {
    await gotoFixture(page, "combobox/Closed");
    await expect(page.locator("#fixture")).toHaveScreenshot("combobox-closed.png");
  });

  test("open", async ({ page }) => {
    await gotoFixture(page, "combobox/Open");
    await expect(page).toHaveScreenshot("combobox-open.png");
  });
});
