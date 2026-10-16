import { type RenderResult, render } from "@testing-library/react";
import { cancelFrame, frame } from "motion/react";
import type { ReactElement, ReactNode } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { reloadMotion } from "./lib/use-motion";

/**
 * Base UI's InternalBackdrop: an empty, transparent `position: fixed; inset: 0` element that a
 * modal popup (Menu, Select, a modal Popover) lays over the page to catch outside clicks. The
 * role tells it apart from the page content that Base UI marks `data-base-ui-inert` behind a
 * popup, which has none. An author's own `role="presentation"` element (a layout table) that Base
 * UI marks inert has content, so `isInvisibleBackdrop` also requires the element to be empty.
 */
const INVISIBLE_BACKDROP = '[role="presentation"][data-base-ui-inert]';
const PORTAL = "[data-base-ui-portal]";
const isInvisibleBackdrop = (el: Element) => el.matches(INVISIBLE_BACKDROP) && !el.hasChildNodes();

/**
 * How far in CSS px the content of `fixture` reaches past each of its edges, 0 where it fits.
 * Walks the box of every element and the text under it, so the direction of the page and the
 * positioning of the content don't matter. Content that an `overflow` ancestor clips doesn't
 * count: a screenshot doesn't show it either. Boxes of 1px or less in both dimensions don't
 * count: they are visually hidden (`sr-only`, focus guards) and show nothing. A box that is thin
 * in one dimension only (a 300 × 1 divider) does count.
 *
 * Portalled content counts too. A Base UI popup portals to a `<div data-base-ui-portal>` on
 * <body>, outside the fixture that opened it, and a screenshot of the fixture shows the popup
 * only where it lies inside the fixture's box. What belongs to `fixture`: its descendants, and the
 * content of every Base UI portal on the page, but not a portal that holds the fixture
 * (the popup's own boxes surround it). Testing Library removes the test's tree and its portals
 * after the test, so the portals on the page belong to what the test screenshots. Screenshot the
 * whole fixture, or the page, while a popup is open: a part of the fixture fails for a popup
 * outside that part. Two things in a portal don't count, as they paint nothing: the portal's own
 * `<div>` (it spans <body> at no height), and the empty, transparent backdrop that a modal popup
 * lays over the whole page (an empty `INVISIBLE_BACKDROP`). Each portal is walked once, on its
 * own: a nested popup's portal, which Floating UI puts inside its parent's, is skipped in the
 * parent's walk.
 *
 * Limits: the walk skips what an `overflow` ancestor holds, so a `position: absolute` or `fixed`
 * descendant whose containing block lies outside that ancestor is skipped too, although the
 * ancestor doesn't clip it. Boxes are measured with their transforms applied, as they are at the
 * moment of the call: a popup sits at the page's top left, transparent, until Floating UI has
 * positioned it, so wait for it to settle before a screenshot of a fixture.
 *
 * `portals: false` leaves the portalled content out. `renderFixture` does that for its check
 * after the render: a modal that is open from the start (a Dialog) fills the page, which no
 * fixture screenshot is meant to show; the check before a screenshot counts it.
 */
export function overflowPast(fixture: Element, { portals = true }: { portals?: boolean } = {}) {
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
        if (isInvisibleBackdrop(child) || child.matches(PORTAL)) continue;
        measure(child.getBoundingClientRect());
        if (getComputedStyle(child).overflow === "visible") walk(child);
      } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        range.selectNodeContents(child);
        measure(range.getBoundingClientRect());
      }
    }
  };
  walk(fixture);
  if (portals) {
    for (const portal of document.querySelectorAll(PORTAL)) {
      if (!portal.contains(fixture)) walk(portal);
    }
  }
  return past;
}

/**
 * Fails when content reaches past `el`, as a screenshot of `el` would crop it. Passes for an
 * element in a fixture rendered with `allowOverflow`. `renderFixture` runs it after the render,
 * and vitest.visual.setup.ts before every `toMatchScreenshot`, on the element it captures.
 */
export function expectNoOverflow(el: Element, options?: { portals?: boolean }) {
  if (el.closest("[data-allow-overflow]")) return;
  expect(
    overflowPast(el, options),
    "content past the screenshotted element, which a screenshot crops",
  ).toEqual({
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
 * after the render (its descendants only) and again at each screenshot (`expectNoOverflow`, which
 * counts the portalled content too). Give the spec a wider page
 * with `withViewport`, or pass `allowOverflow` when the overflow is what the spec shows.
 */
export async function renderFixture(
  children: ReactNode,
  { allowOverflow = false }: { allowOverflow?: boolean } = {},
): Promise<RenderResult & { fixture: HTMLElement }> {
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
  expectNoOverflow(fixture, { portals: false });
  return { ...result, fixture };
}

/**
 * Resizes the test page to `width` × `height` CSS px for the calling `describe` block, and back.
 * Throws when the page doesn't fit the runner's browser window, where Vitest would scale it down
 * and the screenshots would no longer be one px per CSS px. The test page is an iframe of the
 * runner page, which is the window and same-origin, so `window.parent` measures it.
 */
export function withViewport(width: number, height?: number) {
  const { innerWidth: windowWidth, innerHeight: windowHeight } = window.parent;
  if (width > windowWidth || (height ?? 0) > windowHeight) {
    throw new Error(
      `withViewport(${width}, ${height}) does not fit the ${windowWidth} × ${windowHeight} runner window, and Vitest would scale the page down: raise RUNNER_WINDOW in vitest.visual.config.ts`,
    );
  }
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

/** The colour a system colour keyword resolves to under the current (forced) colours. */
export function systemColour(keyword: string) {
  const probe = document.createElement("div");
  probe.style.color = keyword;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

/** The properties `el` is transitioning */
export function transitionsOf(el: Element) {
  return el.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty);
}

/** The outline properties `el` is transitioning */
export function outlineTransitions(el: Element) {
  return transitionsOf(el).filter((property) => property?.startsWith("outline"));
}

/** Moves focus to `el` and asserts it shows as keyboard focus, so the ring is drawn */
export function focusVisible(el: HTMLElement) {
  el.focus();
  expect(el.matches(":focus-visible")).toBe(true);
}

/** Asserts each element shows the not-allowed cursor and still takes the pointer. */
export function expectNotAllowed(...elements: HTMLElement[]) {
  for (const el of elements) {
    const { cursor, pointerEvents } = getComputedStyle(el);
    expect({ cursor, pointerEvents }).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
  }
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
      beforeEach(() => emulateReducedMotion(reducedMotion === "reduce"));
      afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));
      define(reducedMotion);
    },
  );
}

/**
 * The CSS path of a popup with no reduced-motion preference: Motion never arrives, so the popup
 * scales and fades by CSS transition, as the spring does. `ui(open)` renders the popup, with
 * `data-testid="popup"`, open or closed.
 */
export function describePopupCssPath(name: string, ui: (open: boolean) => ReactElement) {
  describe(`${name} on the CSS path`, () => {
    beforeAll(() => enterMotionPath(false));
    beforeEach(() => emulateReducedMotion(false));
    afterAll(async () => {
      await commands.emulateMedia({ reducedMotion: "reduce" });
      await enterMotionPath(true);
    });

    // The start is read in the task that opens it: Base UI clears `data-starting-style` on the
    // next frame.
    it("enters from scale-95 and opacity-0", () => {
      const { rerender, getByTestId } = render(ui(false));
      rerender(ui(true));
      const popup = getByTestId("popup");
      expect(popup).toHaveAttribute("data-starting-style");
      const { scale, opacity } = getComputedStyle(popup);
      expect({ scale, opacity }).toEqual({ scale: "0.95", opacity: "0" });
    });

    it("leaves to scale-95 and opacity-0", async () => {
      const { rerender, getByTestId } = render(ui(false));
      rerender(ui(true));
      const popup = getByTestId("popup");
      // Wait out the enter, so the leave is the only transition running
      await expect.poll(() => popup.hasAttribute("data-starting-style")).toBe(false);
      await expect.poll(() => transitionsOf(popup)).toEqual([]);
      rerender(ui(false));
      expect(popup).toHaveAttribute("data-ending-style");
      expect(transitionsOf(popup).sort()).toEqual(["opacity", "scale"]);
    });
  });
}

/** How long a poll or `waitForStable` waits for a value to settle, in ms. */
export const SETTLE_TIMEOUT_MS = 5000;

/**
 * Emulates the reduced-motion preference and resolves on the media query's change event. Motion
 * and the components read the preference from that event, which lands after `matches` flips.
 * Change events dispatch to the oldest list first, so this fresh list hears it after every older
 * listener. Resolves at once when the preference already matches `reduce`.
 */
export async function emulateReducedMotion(reduce: boolean) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  if (query.matches === reduce) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const changed = new Promise<void>((resolve, reject) => {
    query.addEventListener("change", () => resolve(), { once: true });
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `emulateReducedMotion(${reduce}): no change event within ${SETTLE_TIMEOUT_MS}ms`,
          ),
        ),
      SETTLE_TIMEOUT_MS,
    );
  });
  try {
    await commands.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
    await changed;
  } finally {
    clearTimeout(timer);
  }
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Calls `measure` once per animation frame until it returns the same value for `frames` frames
 * in a row, so geometry is read after a CSS transition or Motion spring has come to rest.
 */
export async function waitForStable<T>(
  measure: () => T,
  { frames = 10, timeout = SETTLE_TIMEOUT_MS }: { frames?: number; timeout?: number } = {},
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

/** Resolves in the first frame in which `read` returns something other than it returns now */
export async function untilChanged<T>(read: () => T) {
  const before = JSON.stringify(read());
  const deadline = performance.now() + SETTLE_TIMEOUT_MS;
  while (JSON.stringify(read()) === before) {
    if (performance.now() > deadline) {
      throw new Error(`Still ${before} after ${SETTLE_TIMEOUT_MS}ms`);
    }
    await nextFrame();
  }
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

type BoxSize = { inlineSize: number; blockSize: number };

const borderBoxOf = (el: Element): BoxSize => {
  const { width, height } = el.getBoundingClientRect();
  return { inlineSize: width, blockSize: height };
};

/** The content box of `el`, as a ResizeObserver reports it: its border box less padding and border */
function contentBoxOf(el: Element): BoxSize {
  const { inlineSize, blockSize } = borderBoxOf(el);
  const style = getComputedStyle(el);
  const sum = (...lengths: string[]) =>
    lengths.reduce((total, length) => total + Number.parseFloat(length), 0);
  return {
    inlineSize:
      inlineSize -
      sum(style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth),
    blockSize:
      blockSize -
      sum(style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth),
  };
}

const sameSize = (a: BoxSize | undefined, b: BoxSize | undefined) =>
  a?.inlineSize === b?.inlineSize && a?.blockSize === b?.blockSize;

/**
 * Reads `read` in the first frame in which a box an indicator follows changes size: the border
 * box of one of `items`, or the border or content box of `container`. It reads after the
 * component's ResizeObservers and before that frame paints, as these observers are created after
 * the component's. A first notification that reports no change is skipped.
 */
export function beforePaintOnceResized<T>(
  { items, container }: { items: Element[]; container: Element },
  read: () => T,
) {
  const borderBoxes = new Map([...items, container].map((el) => [el, borderBoxOf(el)]));
  const containerContentBox = contentBoxOf(container);
  return new Promise<T>((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      borderBoxObserver.disconnect();
      contentBoxObserver.disconnect();
    };
    const onResize = (entries: ResizeObserverEntry[]) => {
      const changed = entries.some(
        ({ target, borderBoxSize, contentBoxSize }) =>
          !sameSize(borderBoxSize[0], borderBoxes.get(target)) ||
          (target === container && !sameSize(contentBoxSize[0], containerContentBox)),
      );
      if (!changed) return;
      stop();
      resolve(read());
    };
    // Stops watching, so a row that resizes nothing fails here and not as a later test's error
    const timer = setTimeout(() => {
      stop();
      reject(
        new Error(
          `beforePaintOnceResized: no item's border box or the container's border or content box resized within ${SETTLE_TIMEOUT_MS}ms`,
        ),
      );
    }, SETTLE_TIMEOUT_MS);
    // One observer can't observe an element by two boxes: the container's content box has its own
    const borderBoxObserver = new ResizeObserver(onResize);
    const contentBoxObserver = new ResizeObserver(onResize);
    for (const el of borderBoxes.keys()) borderBoxObserver.observe(el, { box: "border-box" });
    contentBoxObserver.observe(container, { box: "content-box" });
  });
}

/**
 * Reads `read` in the first frame in which a new ResizeObserver of `target` is notified: the next
 * frame, or, while `target` measures 0×0 (hidden), the first frame it shows in. Call it once the
 * component has mounted, in the task of a change: this observer, created after the component's,
 * reads after them and before the frame that change paints in. That holds for a move too, which
 * resizes nothing: the component's MutationObserver hears of it in that task, and its
 * `notifyResize` has the shared ResizeObserver run in the same frame.
 */
export function beforePaint<T>(target: Element, read: () => T) {
  return new Promise<T>((resolve) => {
    const observer = new ResizeObserver(() => {
      observer.disconnect();
      resolve(read());
    });
    observer.observe(target);
  });
}

/** An indicator spec's read of a frame: the indicator's box, and how far it is off its target */
type IndicatorFrame<Box> = { indicator: Box; off: number };

/**
 * Asserts an indicator follows a change to its target with no stale frame. `firstFrame` reads the
 * frame the change paints in, before it paints (`beforePaint` or `beforePaintOnceResized`, set up
 * in the task of the change); `read` then reads each of the 20 frames painted after it. The
 * indicator is over its target in every frame and ends away from `start`. `near` compares two
 * boxes, within 1px.
 */
export async function expectFollowsFromFirstFrame<Box>(
  firstFrame: Promise<IndicatorFrame<Box>>,
  read: () => IndicatorFrame<Box>,
  start: Box,
  near: (a: Box, b: Box) => boolean,
) {
  // Started once the first frame is read, so it reads the frames after it
  const frames = [await firstFrame, ...(await eachPaintedFrame(read, 20))];
  const log = JSON.stringify(frames);
  // The change moves or resizes the target, and the indicator with it
  expect(near(start, frames.at(-1)?.indicator ?? start), log).toBe(false);
  // Over the target in every frame, the first one painted included
  expect(
    frames.every((frame) => frame.off <= 1),
    log,
  ).toBe(true);
}

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
