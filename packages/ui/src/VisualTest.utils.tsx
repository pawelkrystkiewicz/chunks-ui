import { render } from "@testing-library/react";
import { cancelFrame, frame } from "motion/react";
import type { ReactNode } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { reloadMotion } from "./lib/use-motion";

/**
 * How far in CSS px the content of `fixture` reaches past each of its edges, 0 where it fits.
 * Walks the box of every element and the text under it, so the direction of the page and the
 * positioning of the content don't matter. Content that an `overflow` ancestor clips doesn't
 * count: a screenshot doesn't show it either. Boxes of 1px or less in both dimensions don't
 * count: they are visually hidden (`sr-only`, focus guards) and show nothing. A box that is thin
 * in one dimension only (a 300 × 1 divider) does count.
 *
 * Limits: the walk skips what an `overflow` ancestor holds, so a `position: absolute` or `fixed`
 * descendant whose containing block lies outside that ancestor is skipped too, although the
 * ancestor doesn't clip it. Boxes are measured with their transforms applied, as they are at the
 * moment of the call. Only `fixture`'s descendants count: a popup portals to <body>, outside a
 * fixture, so a spec that screenshots an open popup screenshots the page (`renderPage`).
 */
export function overflowPast(fixture: Element) {
  const box = fixture.getBoundingClientRect();
  const past = { top: 0, right: 0, bottom: 0, left: 0 };
  const measure = (rect: DOMRect) => {
    if (Math.max(rect.width, rect.height) <= 1) return;
    past.top = Math.max(past.top, Math.round(box.top - rect.top));
    past.right = Math.max(past.right, Math.round(rect.right - box.right));
    past.bottom = Math.max(past.bottom, Math.round(rect.bottom - box.bottom));
    past.left = Math.max(past.left, Math.round(box.left - rect.left));
  };
  const range = document.createRange();
  const walk = (el: Element) => {
    for (const child of el.childNodes) {
      if (child instanceof Element) {
        measure(child.getBoundingClientRect());
        if (getComputedStyle(child).overflow === "visible") walk(child);
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        range.selectNodeContents(child);
        measure(range.getBoundingClientRect());
      }
    }
  };
  walk(fixture);
  return past;
}

/**
 * Fails when content reaches past `el`, as a screenshot of `el` would crop it. Passes for an
 * element in a fixture rendered with `allowOverflow`. `renderFixture` runs it after the render,
 * and vitest.visual.setup.ts before every `toMatchScreenshot`, on the element it captures.
 */
export function expectNoOverflow(el: Element) {
  if (el.closest("[data-allow-overflow]")) return;
  expect(overflowPast(el), "content past the fixture, which a screenshot crops").toEqual({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
}

/**
 * Renders children in a padded fixture wrapper. Returns the wrapper element for screenshotting.
 *
 * Fails when the content reaches past the fixture, as a screenshot of the fixture would crop it,
 * after the render and again at each screenshot (`expectNoOverflow`). Give the spec a wider page
 * with `withViewport`, or pass `allowOverflow` when the overflow is what the spec shows.
 */
export async function renderFixture(
  children: ReactNode,
  { allowOverflow = false }: { allowOverflow?: boolean } = {},
) {
  const result = render(
    <div
      data-testid="fixture"
      data-allow-overflow={allowOverflow || undefined}
      style={{ padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {children}
    </div>,
  );
  await document.fonts.ready;
  const fixture = result.getByTestId("fixture");
  expectNoOverflow(fixture);
  return { ...result, fixture };
}

/**
 * Resizes the test page to `width` × `height` CSS px for the calling `describe` block, and back.
 */
export function withViewport(width: number, height?: number) {
  let previous: [number, number] | undefined;
  beforeAll(async () => {
    previous = [innerWidth, innerHeight];
    await page.viewport(width, height ?? innerHeight);
  });
  afterAll(async () => {
    if (previous) await page.viewport(...previous);
  });
}

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

/** `--ring` as the browser computes it for an outline colour */
export function ringColor() {
  const probe = document.createElement("span");
  probe.style.outlineColor = "var(--ring)";
  document.body.append(probe);
  const color = getComputedStyle(probe).outlineColor;
  probe.remove();
  return color;
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

/** A node of Chromium's accessibility tree, as the `accessibilityTree` command returns it. */
export type AccessibilityNode = { role: string; name: string; children: AccessibilityNode[] };

declare module "vitest/browser" {
  interface BrowserCommands {
    /** Playwright `page.emulateMedia`, registered in vitest.visual.config.ts. */
    emulateMedia: (options: EmulatedMedia) => Promise<void>;
    /** Moves the mouse outside the viewport, registered in vitest.visual.config.ts. */
    parkPointer: () => Promise<void>;
    /** Chromium's accessibility tree for a CSS selector; see vitest.visual.config.ts. */
    accessibilityTree: (selector: string) => Promise<AccessibilityNode>;
  }
}

/** Chromium's accessibility tree for `element`, via the `accessibilityTree` command. */
export async function accessibilityTreeOf(element: Element) {
  const id = crypto.randomUUID();
  element.setAttribute("data-accessibility-tree", id);
  try {
    return await commands.accessibilityTree(`[data-accessibility-tree="${id}"]`);
  } finally {
    element.removeAttribute("data-accessibility-tree");
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

/** The largest distance in CSS px between an edge of `inner` and the same edge of `outer` */
export const offBy = (outer: Element, inner: Element) =>
  Math.max(...Object.values(insetsWithin(outer, inner)).map(Math.abs));

/**
 * The two paths of a Motion-driven part with no reduced-motion preference: Motion animates it,
 * or Motion never arrives and the CSS fallback does. Pass `withMotion` to `enterMotionPath`.
 */
export const MOTION_PATHS = [
  { path: "Motion", withMotion: true },
  { path: "CSS fallback", withMotion: false },
] as const;

/**
 * Loads Motion, or holds it back for good so parts that mount next keep the CSS fallback. A
 * held-back load never settles, so it isn't awaited.
 */
export async function enterMotionPath(withMotion: boolean) {
  if (withMotion) await reloadMotion();
  else void reloadMotion(new Promise(() => {}));
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

export type Dir = "ltr" | "rtl";

/**
 * An element's extent along the inline axis: distances that grow from left to right in LTR and
 * from right to left in RTL. `a.end <= b.start` reads "a comes before b" in either direction.
 * Takes an element or a `Range`, to measure text.
 */
export function inlineSpan(el: Pick<Element, "getBoundingClientRect">, dir: Dir) {
  const { left, right } = el.getBoundingClientRect();
  return dir === "ltr" ? { start: left, end: right } : { start: -right, end: -left };
}

export const px = (value: string) => Number.parseFloat(value);

/** The inline extent of `el`'s content box: inside its border and padding */
export function contentSpan(el: Element, dir: Dir) {
  const style = getComputedStyle(el);
  const { start, end } = inlineSpan(el, dir);
  return {
    start: start + px(style.borderInlineStartWidth) + px(style.paddingInlineStart),
    end: end - px(style.borderInlineEndWidth) - px(style.paddingInlineEnd),
  };
}

/** How far an arrow's foot reaches past its unturned box on each side: (√2 − 1)/2 of its size. */
export function arrowOverhang(arrow: Element) {
  return (px(getComputedStyle(arrow).width) * (Math.SQRT2 - 1)) / 2;
}

/** Chromium lays boxes out in 1/64 px, so an arrow held a fraction of a pixel in rounds to it. */
export const LAYOUT_ROUNDING_PX = 1 / 64;

export type Theme = { theme: string; vars: Record<string, string> };

/** The default theme, and one with a larger corner radius and a larger `--spacing` (and arrow). */
export const THEMES: Theme[] = [
  { theme: "default theme", vars: {} },
  { theme: "--radius 1rem, --spacing 5px", vars: { "--radius": "1rem", "--spacing": "5px" } },
];

/** The popup is portalled to <body>, so the theme goes on the root element. */
export function applyTheme(vars: Theme["vars"]) {
  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(name, value);
  }
}

export function resetTheme(vars: Theme["vars"]) {
  for (const name of Object.keys(vars)) document.documentElement.style.removeProperty(name);
}
