import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Chip", () => {
  test("color matrix", async ({ page }) => {
    await gotoFixture(page, "chip/ColorMatrix");
    await expect(page.locator("#fixture")).toHaveScreenshot("chip-color-matrix.png");
  });

  test("removable", async ({ page }) => {
    await gotoFixture(page, "chip/Removable");
    await expect(page.locator("#fixture")).toHaveScreenshot("chip-removable.png");
  });
});
