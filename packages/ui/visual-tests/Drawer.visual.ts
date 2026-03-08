import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Drawer", () => {
  test("right", async ({ page }) => {
    await gotoFixture(page, "drawer/Right");
    await expect(page).toHaveScreenshot("drawer-right.png");
  });

  test("left", async ({ page }) => {
    await gotoFixture(page, "drawer/Left");
    await expect(page).toHaveScreenshot("drawer-left.png");
  });

  test("bottom", async ({ page }) => {
    await gotoFixture(page, "drawer/Bottom");
    await expect(page).toHaveScreenshot("drawer-bottom.png");
  });
});
