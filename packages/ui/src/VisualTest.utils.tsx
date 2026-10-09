import { render } from "@testing-library/react";
import { createRef, type ReactNode, type Ref } from "react";
import { page } from "vitest/browser";

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

/** Each edge of `a` within `tolerance` px of the same edge of `b`. */
export function sameBox(
  a: Pick<DOMRect, "left" | "top" | "width" | "height">,
  b: Pick<DOMRect, "left" | "top" | "width" | "height">,
  tolerance = 1,
) {
  return [a.left - b.left, a.top - b.top, a.width - b.width, a.height - b.height].every(
    (delta) => Math.abs(delta) <= tolerance,
  );
}

export type ConsumerRefKind = "object" | "callback" | "undefined";

/** A ref of the given kind, as a consumer would pass it, and a way to read what it received. */
export function consumerRef<T extends HTMLElement>(kind: ConsumerRefKind) {
  if (kind === "object") {
    const ref = createRef<T>();
    return { ref: ref as Ref<T>, received: () => ref.current };
  }
  if (kind === "callback") {
    let node: T | null = null;
    const ref = (element: T | null) => {
      node = element;
    };
    return { ref: ref as Ref<T>, received: () => node };
  }
  return { ref: undefined, received: () => undefined };
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
