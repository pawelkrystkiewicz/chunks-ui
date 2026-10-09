import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { page, type ScreenshotMatcherOptions } from "vitest/browser";

/** Renders children in a padded fixture wrapper. Returns the wrapper element for screenshotting. */
export async function renderFixture(children: ReactNode) {
  const result = render(
    <div
      data-testid="fixture"
      style={{ padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {children}
    </div>,
  );
  await document.fonts.ready;
  return { ...result, fixture: result.getByTestId("fixture") };
}

/**
 * `toMatchScreenshot` options for small or faint features, such as the Tabs.Indicator pill (white
 * on a 97% grey list). The config's 0.1 colour threshold can't see a pill that differs from the list
 * by ~10 grey levels, so a 0×0 pill passed; 0.02 counts ~5 levels. The 24 px budget leaves headroom
 * for renderer drift. The config's 5% ratio still applies; the lower limit wins.
 */
export const SMALL_FEATURE_SCREENSHOT = {
  comparatorName: "pixelmatch",
  comparatorOptions: { threshold: 0.02, allowedMismatchedPixels: 24 },
} satisfies ScreenshotMatcherOptions<"pixelmatch">;

/** For portal-based components (Dialog, Drawer, Tooltip, etc.) that render fixed-position content. */
export async function renderPage(children: ReactNode) {
  render(children);
  await document.fonts.ready;
  return page.elementLocator(document.body);
}

/** Pauses all CSS animations — use for components with loaders/spinners. */
export function pauseAnimations() {
  for (const el of document.querySelectorAll("*")) {
    (el as HTMLElement).style.animationPlayState = "paused";
  }
}

/** Media features the `emulateMedia` command can set. The config default is reduced motion. */
export type EmulatedMedia = {
  reducedMotion?: "reduce" | "no-preference";
  forcedColors?: "active" | "none";
};

declare module "vitest/browser" {
  interface BrowserCommands {
    /** Playwright `page.emulateMedia`, registered in vitest.visual.config.ts. */
    emulateMedia: (options: EmulatedMedia) => Promise<void>;
  }
}

export type Insets = { top: number; right: number; bottom: number; left: number };

/** Distance in CSS px from each edge of `outer` to the same edge of `inner`, transforms included. */
export function insetsWithin(outer: Element, inner: Element): Insets {
  const o = outer.getBoundingClientRect();
  const i = inner.getBoundingClientRect();
  return {
    top: i.top - o.top,
    right: o.right - i.right,
    bottom: o.bottom - i.bottom,
    left: i.left - o.left,
  };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Calls `measure` once per animation frame until it returns the same value for `frames` frames
 * in a row, so geometry is read after a CSS transition or Motion spring has come to rest.
 */
export async function waitForStable<T>(
  measure: () => T,
  { frames = 10, timeout = 5000 }: { frames?: number; timeout?: number } = {},
): Promise<T> {
  const deadline = performance.now() + timeout;
  let value = measure();
  let unchanged = 0;
  while (unchanged < frames) {
    if (performance.now() > deadline) {
      throw new Error(`Value did not settle within ${timeout}ms: ${JSON.stringify(value)}`);
    }
    await nextFrame();
    const next = measure();
    unchanged = JSON.stringify(next) === JSON.stringify(value) ? unchanged + 1 : 0;
    value = next;
  }
  return value;
}
