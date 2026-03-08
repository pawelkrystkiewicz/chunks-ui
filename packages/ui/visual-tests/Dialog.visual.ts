import { expect, test } from "@playwright/test";
import { gotoFixture } from "./VisualTest.utils";

test.describe("Dialog", () => {
  test("open", async ({ page }) => {
    await gotoFixture(page, "dialog/Open");
    await expect(page).toHaveScreenshot("dialog-open.png");
  });
});
