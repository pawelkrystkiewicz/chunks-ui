import type { Page } from "@playwright/test";

/** Navigate to a fixture and wait for fonts to load. */
export async function gotoFixture(page: Page, path: string) {
  await page.goto(`/#/${path}`);
  await page.evaluate(() => document.fonts.ready);
}

/** Pause all CSS animations (useful for Loader spinner). */
export async function pauseAnimations(page: Page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      (el as HTMLElement).style.animationPlayState = "paused";
    }
  });
}
