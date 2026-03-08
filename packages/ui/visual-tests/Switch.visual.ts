import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Switch", () => {
  test("states", async ({ page }) => {
    await gotoFixture(page, "switch/States");
    await expect(page.locator("#fixture")).toHaveScreenshot("switch-states.png");
  });
});
