import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Avatar", () => {
  test("shapes", async ({ page }) => {
    await gotoFixture(page, "avatar/Shapes");
    await expect(page.locator("#fixture")).toHaveScreenshot("avatar-shapes.png");
  });

  test("sizes", async ({ page }) => {
    await gotoFixture(page, "avatar/Sizes");
    await expect(page.locator("#fixture")).toHaveScreenshot("avatar-sizes.png");
  });
});
