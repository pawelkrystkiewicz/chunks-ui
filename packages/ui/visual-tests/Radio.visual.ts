import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Radio", () => {
  test("group", async ({ page }) => {
    await gotoFixture(page, "radio/Group");
    await expect(page.locator("#fixture")).toHaveScreenshot("radio-group.png");
  });
});
