import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Textarea", () => {
  test("default", async ({ page }) => {
    await gotoFixture(page, "textarea/Default");
    await expect(page.locator("#fixture")).toHaveScreenshot("textarea-default.png");
  });

  test("with value", async ({ page }) => {
    await gotoFixture(page, "textarea/WithValue");
    await expect(page.locator("#fixture")).toHaveScreenshot("textarea-with-value.png");
  });

  test("disabled", async ({ page }) => {
    await gotoFixture(page, "textarea/Disabled");
    await expect(page.locator("#fixture")).toHaveScreenshot("textarea-disabled.png");
  });
});
