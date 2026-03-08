import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("ToggleGroup", () => {
  test("single selection", async ({ page }) => {
    await gotoFixture(page, "toggle-group/Single");
    await expect(page.locator("#fixture")).toHaveScreenshot("toggle-group-single.png");
  });

  test("with disabled item", async ({ page }) => {
    await gotoFixture(page, "toggle-group/WithDisabled");
    await expect(page.locator("#fixture")).toHaveScreenshot("toggle-group-with-disabled.png");
  });
});
