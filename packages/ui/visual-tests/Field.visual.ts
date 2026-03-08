import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Field", () => {
  test("default", async ({ page }) => {
    await gotoFixture(page, "field/Default");
    await expect(page.locator("#fixture")).toHaveScreenshot("field-default.png");
  });

  test("with error", async ({ page }) => {
    await gotoFixture(page, "field/WithError");
    await expect(page.locator("#fixture")).toHaveScreenshot("field-with-error.png");
  });

  test("disabled", async ({ page }) => {
    await gotoFixture(page, "field/Disabled");
    await expect(page.locator("#fixture")).toHaveScreenshot("field-disabled.png");
  });
});
