import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Checkbox", () => {
  test("states", async ({ page }) => {
    await gotoFixture(page, "checkbox/States");
    await expect(page.locator("#fixture")).toHaveScreenshot("checkbox-states.png");
  });
});
