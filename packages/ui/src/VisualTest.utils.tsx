import { type RenderResult, render } from "@testing-library/react";
import { cancelFrame, frame } from "motion/react";
import type { ReactElement, ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { reloadMotion, useMotion } from "./lib/use-motion";
import { SETTLE_TIMEOUT_MS } from "./VisualTest.timeouts";

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

/** Both inline directions, left to right first */
export const DIRS: Dir[] = ["ltr", "rtl"];

/**
 * Runs `define` once per direction, with `dir` on <html> through each test, as an app sets it, so
 * portalled popups inherit it. `name` takes the direction at `%s`, as in `describe.each`. Base UI's
 * `DirectionProvider` (keyboard navigation, logical popup sides) is the spec's to add, as
 * `renderIn` in Rtl.visual.spec.tsx does.
 */
export function describeDirs(name: string, define: (dir: Dir) => void) {
  describe.each(DIRS)(name, (dir) => {
    beforeEach(() => {
      document.documentElement.dir = dir;
    });
    afterEach(() => document.documentElement.removeAttribute("dir"));
    define(dir);
  });
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

export type PixelBox = { x: number; y: number; width: number; height: number };

/** The viewport px `el` covers, cut to the viewport */
function pixelBox(el: Element): PixelBox {
  const box = el.getBoundingClientRect();
  const x = Math.max(0, Math.floor(box.left));
  const y = Math.max(0, Math.floor(box.top));
  const width = Math.min(window.innerWidth, Math.ceil(box.right)) - x;
  const height = Math.min(window.innerHeight, Math.ceil(box.bottom)) - y;
  expect(width > 0 && height > 0, "the element is in the viewport").toBe(true);
  return { x, y, width, height };
}

/** The RGBA pixels the page paints in `box`, from a screenshot */
async function capture({ x, y, width, height }: PixelBox) {
  const image = new Image();
  image.src = `data:image/png;base64,${await page.screenshot({ save: false })}`;
  await image.decode();
  // One image px per CSS px, so a box in CSS px reads the same pixels
  expect(image.naturalWidth).toBe(window.innerWidth);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(x, y, width, height).data;
}

/** How many pixels differ between two captures of the same box */
function changedPixels(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
  }
  return changed;
}

/**
 * How many pixels of its box (or of `box`) `el` paints: those that change when it and everything
 * inside it is hidden. Hiding `el` alone leaves a descendant that sets its own `visibility:
 * visible` painting. With `pseudo`, e.g. "::after", only that pseudo-element is hidden.
 *
 * Reads a screenshot of the page, so `el` must lie in the viewport, and the page must have one
 * image px per CSS px: the default page, or one that `withViewport` set.
 */
export async function paintedPixels(el: HTMLElement, pseudo = "", box = pixelBox(el)) {
  const shown = await capture(box);
  // micro-interactions transitions every property, visibility included: hide at once
  const attribute = "data-paint-probe";
  const probe = document.createElement("style");
  probe.textContent = pseudo
    ? `[${attribute}]${pseudo} { display: none !important; }`
    : `[${attribute}], [${attribute}] * { transition: none !important; visibility: hidden !important; }`;
  document.head.append(probe);
  el.setAttribute(attribute, "");
  try {
    return changedPixels(shown, await capture(box));
  } finally {
    el.removeAttribute(attribute);
    probe.remove();
  }
}

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

/**
 * Shows `data-testid="motion-loaded"` once `useMotion()` returns Motion. Every part of the same
 * tree that reads Motion with `useMotion()` re-renders with it in the same render, so once the
 * marker shows, Motion's arrival has been rendered. Render it beside the parts under test.
 */
export function MotionLoaded() {
  return useMotion() ? <span data-testid="motion-loaded" /> : null;
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
      afterAll(() => emulateReducedMotion(true));
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
      await emulateReducedMotion(true);
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

export { SETTLE_TIMEOUT_MS };

// Taken at import, before a spec's vi.useFakeTimers(), so the guard runs on real time
const { setTimeout: realSetTimeout, clearTimeout: realClearTimeout } = globalThis;

/**
 * Emulates `media` and resolves on the change event of `query`, once it matches `want`. Resolves
 * at once when it already does. Fails when no change event comes within SETTLE_TIMEOUT_MS.
 */
async function emulateAndWait(query: string, want: boolean, media: EmulatedMedia) {
  const list = matchMedia(query);
  if (list.matches === want) return;
  let timer: ReturnType<typeof realSetTimeout> | undefined;
  const changed = new Promise<void>((resolve, reject) => {
    list.addEventListener("change", () => resolve(), { once: true });
    timer = realSetTimeout(
      () =>
        reject(
          new Error(
            `emulateMedia(${JSON.stringify(media)}): no change event within ${SETTLE_TIMEOUT_MS}ms`,
          ),
        ),
      SETTLE_TIMEOUT_MS,
    );
  });
  try {
    await commands.emulateMedia(media);
    await changed;
  } finally {
    realClearTimeout(timer);
  }
}

/**
 * Emulates the reduced-motion preference and resolves on the media query's change event. Motion
 * and the components read the preference from that event, which lands after `matches` flips.
 * Change events dispatch to the oldest list first, so this fresh list hears it after every older
 * listener. Resolves at once when the preference already matches `reduce`.
 */
export function emulateReducedMotion(reduce: boolean) {
  return emulateAndWait("(prefers-reduced-motion: reduce)", reduce, {
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
}

/**
 * Emulates forced colours and resolves on the media query's change event, once
 * `(forced-colors: active)` matches `active`. Resolves at once when the query already matches.
 */
export function emulateForcedColors(active: boolean) {
  return emulateAndWait("(forced-colors: active)", active, {
    forcedColors: active ? "active" : "none",
  });
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

/** The rendered width over the layout width: 1 while nothing scales `el` */
export const renderedScale = (el: Element) =>
  Math.round(
    (el.getBoundingClientRect().width / Number.parseFloat(getComputedStyle(el).width)) * 1000,
  ) / 1000;

/** The popup's side, rendered scale and opacity, once a painted frame while it is mounted */
export const framesOf = async (popup: HTMLElement) => {
  const frames = await eachPaintedFrame(
    () =>
      popup.isConnected && {
        side: popup.getAttribute("data-side"),
        scale: renderedScale(popup),
        opacity: Number(getComputedStyle(popup).opacity),
      },
    40,
  );
  return frames.filter((frame) => frame !== false);
};

/** Resolves once `popup` is at rest: scale, opacity and box steady, and `getAnimations()` empty */
export const settled = async (popup: HTMLElement) => {
  // Steady first: `getAnimations()` is empty before Motion's first frame starts the entry, and
  // does not see the scale, which Motion animates in JS
  await waitForStable(() => [renderedScale(popup), getComputedStyle(popup).opacity, boxOf(popup)]);
  await expect.poll(() => popup.getAnimations()).toEqual([]);
  // End on a frame: closed from a timer, the popup sometimes survives a missing flush (#540)
  await nextFrame();
};

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
 * the component's. A first notification that reports no change is skipped. The component must keep
 * its shared observer through the change: Tabs subscribes again on a childList change, and as the
 * only Tabs on the page it then gets a new observer, which this one precedes (a false stale frame).
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
 * `notifyResize` has the shared ResizeObserver run in the same frame. As with
 * `beforePaintOnceResized`, the component must keep its shared observer through the change.
 */
export function beforePaint<T>(target: Element, read: () => T) {
  return new Promise<T>((resolve, reject) => {
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      observer.disconnect();
      resolve(read());
    });
    // A target that never shows fails here, not as a later test's error
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(`beforePaint: no ResizeObserver notification within ${SETTLE_TIMEOUT_MS}ms`),
      );
    }, SETTLE_TIMEOUT_MS);
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

// Focus as a popup closes: Base UI returns focus to the trigger only at the end of the exit, as
// the popup unmounts or hides (`isShown`), so the popups' specs press Tab during the exit, on each
// of its paths (#633)

/** Whether a popup is still closing */
type StillClosing = (popup: HTMLElement) => boolean;

const mounted: StillClosing = (popup) => popup.isConnected;

/**
 * Still closing while it shows, for a popup that stays mounted after its exit, hidden: Base UI
 * keeps a Select popup mounted once its trigger has had focus
 */
export const isShown: StillClosing = (popup) => popup.checkVisibility();

/**
 * Runs `define` once per path of a popup's exit, as `${name}, $path`, and passes it whether motion
 * is reduced: with no preference on each of `MOTION_PATHS` (an exit of about 0.5s with Motion,
 * 0.3s on the CSS path), and with reduced motion, an exit of a frame. Reduced motion and Motion
 * are back to the defaults afterwards.
 */
export function describeExitPaths(name: string, define: (reduce: boolean) => void) {
  describe.each([
    ...MOTION_PATHS.map(({ path, withMotion }) => ({ path, withMotion, reduce: false })),
    { path: "reduced motion", withMotion: true, reduce: true },
  ])(`${name}, $path`, ({ withMotion, reduce }) => {
    beforeAll(() => enterMotionPath(withMotion));
    beforeEach(() => emulateReducedMotion(reduce));
    afterAll(async () => {
      await emulateReducedMotion(true);
      await enterMotionPath(true);
    });
    define(reduce);
  });
}

/**
 * Notes whether `popup` was still closing when Tab went down: by default, still mounted. The check
 * it returns fails when it was not, as a Tab after the exit passes without the hand-off. Not with
 * reduced motion: the exit of a frame may be over by then.
 */
export function recordTabDuringExit(
  popup: HTMLElement,
  { reduce, stillClosing = mounted }: { reduce: boolean; stillClosing?: StillClosing },
) {
  let closing: boolean | undefined;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") closing = stillClosing(popup);
  };
  document.addEventListener("keydown", onKeyDown, true);
  return () => {
    document.removeEventListener("keydown", onKeyDown, true);
    if (!reduce) expect(closing, "the popup was still closing when Tab went down").toBe(true);
  };
}

/** Whether `el` has taken focus since the call */
export function tookFocus(el: HTMLElement) {
  let focused = false;
  el.addEventListener("focus", () => {
    focused = true;
  });
  return () => focused;
}

/** Resolves once `popup` is no longer closing: by default, once it has unmounted */
export const exited = (
  popup: HTMLElement,
  { stillClosing = mounted }: { stillClosing?: StillClosing } = {},
) => expect.poll(() => stillClosing(popup)).toBe(false);
