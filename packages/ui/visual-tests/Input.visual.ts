import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Input", () => {
  test("default", async ({ page }) => {
    await gotoFixture(page, "input/Default");
    await expect(page.locator("#fixture")).toHaveScreenshot("input-default.png");
  });

  test("with value", async ({ page }) => {
    await gotoFixture(page, "input/WithValue");
    await expect(page.locator("#fixture")).toHaveScreenshot("input-with-value.png");
  });

  test("disabled", async ({ page }) => {
    await gotoFixture(page, "input/Disabled");
    await expect(page.locator("#fixture")).toHaveScreenshot("input-disabled.png");
  });

  test("invalid", async ({ page }) => {
    await gotoFixture(page, "input/Invalid");
    await expect(page.locator("#fixture")).toHaveScreenshot("input-invalid.png");
  });

  test("with adornments", async ({ page }) => {
    await gotoFixture(page, "input/WithAdornments");
    await expect(page.locator("#fixture")).toHaveScreenshot("input-with-adornments.png");
  });
});
