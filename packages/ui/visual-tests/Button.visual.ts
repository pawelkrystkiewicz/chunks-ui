import { expect, test } from "@playwright/test";
import { gotoFixture, pauseAnimations } from "./VisualTest.utils";

test.describe("Button", () => {
  test("variant matrix", async ({ page }) => {
    await gotoFixture(page, "button/VariantMatrix");
    await expect(page.locator("#fixture")).toHaveScreenshot("button-variant-matrix.png");
  });

  test("disabled", async ({ page }) => {
    await gotoFixture(page, "button/Disabled");
    await expect(page.locator("#fixture")).toHaveScreenshot("button-disabled.png");
  });

  test("with icon", async ({ page }) => {
    await gotoFixture(page, "button/WithIcon");
    await expect(page.locator("#fixture")).toHaveScreenshot("button-with-icon.png");
  });

  test("loading", async ({ page }) => {
    await gotoFixture(page, "button/Loading");
    await pauseAnimations(page);
    await expect(page.locator("#fixture")).toHaveScreenshot("button-loading.png");
  });
});
