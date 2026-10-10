import { render } from "@testing-library/react";
import { cancelFrame, frame } from "motion/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect } from "vitest";
import { commands, page, type ScreenshotMatcherOptions } from "vitest/browser";
import { reloadMotion } from "./lib/use-motion";

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
 * `toMatchScreenshot` options for small or faint features: 0.02 per-pixel colour threshold instead
 * of the default 0.1. The config's zero mismatch ratio still applies.
 */
export const SMALL_FEATURE_SCREENSHOT = {
  comparatorName: "pixelmatch",
  comparatorOptions: { threshold: 0.02 },
} satisfies ScreenshotMatcherOptions<"pixelmatch">;

/** For portal-based components (Dialog, Drawer, Tooltip, etc.) that render fixed-position content. */
export async function renderPage(children: ReactNode) {
  render(children);
  await document.fonts.ready;
  return page.elementLocator(document.body);
}

/** Asserts `disabledEl` is dimmed and ignores the pointer, and `enabledEl` is neither */
export function expectDimmed(disabledEl: Element, enabledEl: Element) {
  const style = (el: Element) => {
    const { opacity, pointerEvents } = getComputedStyle(el);
    return { opacity, pointerEvents };
  };
  expect(style(disabledEl)).toEqual({ opacity: "0.5", pointerEvents: "none" });
  expect(style(enabledEl)).toEqual({ opacity: "1", pointerEvents: "auto" });
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
    /** Moves the mouse outside the viewport, registered in vitest.visual.config.ts. */
    parkPointer: () => Promise<void>;
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

/** Viewport-relative edges of `el`. */
export const boxOf = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return { top, bottom, left, right };
};

/**
 * Runs `define` once per animation path: reduced motion (CSS variants) and no preference with
 * Motion loaded before anything opens (spring path). Media is emulated before each test and
 * reset to the config default afterwards.
 */
export function describeMotionPaths(
  name: string,
  define: (reducedMotion: "reduce" | "no-preference") => void,
) {
  describe.each(["reduce", "no-preference"] as const)(
    `${name}, reduced motion: %s`,
    (reducedMotion) => {
      beforeAll(() => reloadMotion());
      beforeEach(async () => {
        await commands.emulateMedia({ reducedMotion });
        await expect
          .poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
          .toBe(reducedMotion === "reduce");
      });
      afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));
      define(reducedMotion);
    },
  );
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

/**
 * Calls `read` once a frame for `frames` frames, after Motion's render step: the values that
 * frame paints, Motion's writes for it included
 */
export const eachPaintedFrame = <T,>(read: () => T, frames: number) =>
  new Promise<T[]>((resolve) => {
    const values: T[] = [];
    const step = () => {
      values.push(read());
      if (values.length < frames) return;
      cancelFrame(step);
      resolve(values);
    };
    frame.postRender(step, true);
  });
