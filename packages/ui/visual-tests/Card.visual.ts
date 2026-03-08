import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Card", () => {
  test("default", async ({ page }) => {
    await gotoFixture(page, "card/Default");
    await expect(page.locator("#fixture")).toHaveScreenshot("card-default.png");
  });
});
