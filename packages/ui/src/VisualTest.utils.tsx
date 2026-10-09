import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect } from "vitest";
import { page } from "vitest/browser";
import { Dialog } from "./components/dialog";
import { Drawer } from "./components/drawer";

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

type OverlayProps = {
  name: string;
  side?: "left" | "right";
  defaultOpen?: boolean;
  children?: ReactNode;
};

/** A Dialog and a Drawer, each with its trigger, for layering checks. Children go inside. */
export const overlays = {
  Dialog: ({ name, defaultOpen, children }) => (
    <Dialog.Root defaultOpen={defaultOpen}>
      <Dialog.Trigger>Open {name}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop data-testid={`${name} backdrop`} />
        <Dialog.Popup>
          <Dialog.Title>{name}</Dialog.Title>
          {/* Its own line, so a parent is taller than its child and shows around it */}
          <div>{children}</div>
          <Dialog.Close>Close {name}</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  Drawer: ({ name, side, defaultOpen, children }) => (
    <Drawer.Root defaultOpen={defaultOpen}>
      <Drawer.Trigger>Open {name}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop data-testid={`${name} backdrop`} />
        <Drawer.Popup side={side}>
          <Drawer.Title>{name}</Drawer.Title>
          <div>{children}</div>
          <Drawer.Close>Close {name}</Drawer.Close>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  ),
} satisfies Record<string, (props: OverlayProps) => ReactNode>;

export const inside = (box: DOMRect, [x, y]: [number, number]) =>
  x > box.left && x < box.right && y > box.top && y < box.bottom;

// An overlay opened straight from the page portals to <body>, so only its Portal's z-layer
// (drawers 600, modals 700) lifts it above the app's own layers. The fixed bar (40-50% of the
// viewport height) crosses a centred Dialog's top edge; the sticky bar, a trigger line below
// 50vh, crosses its bottom edge. Both run under the full-height Drawer.
export function AppBars() {
  return (
    <>
      <div
        data-testid="fixed bar"
        style={{ position: "fixed", insetInline: 0, top: "40%", height: "10%", zIndex: 50 }}
      />
      <div style={{ height: "50vh" }} />
      <div
        data-testid="sticky bar"
        style={{ position: "sticky", top: 0, height: "10vh", zIndex: 100 }}
      />
      <div style={{ height: "60vh" }} />
    </>
  );
}

/** Centre of the area two boxes share, or `undefined` when they do not meet. */
export const overlap = (a: DOMRect, b: DOMRect): [number, number] | undefined => {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  return right > left && bottom > top ? [(left + right) / 2, (top + bottom) / 2] : undefined;
};

/**
 * Where `popup` covers each app bar, it is the topmost element; where the bar shows past it,
 * the overlay's backdrop is. Reads the boxes as they are now, so it also works mid-animation.
 */
export function expectAboveAppBars(name: string, popup: Element, backdrop: Element) {
  const box = popup.getBoundingClientRect();
  for (const bar of ["fixed bar", "sticky bar"]) {
    const barBox = page.getByTestId(bar).element().getBoundingClientRect();
    const onPopup = overlap(box, barBox);
    if (!onPopup)
      throw new Error(`The ${name} must cover part of the ${bar}, or this proves nothing`);
    expect(popup.contains(document.elementFromPoint(...onPopup)), `${name} over the ${bar}`).toBe(
      true,
    );

    const pastPopup = (
      [
        [barBox.left + 4, barBox.top + 4],
        [barBox.left + 4, barBox.bottom - 4],
        [barBox.right - 4, barBox.top + 4],
        [barBox.right - 4, barBox.bottom - 4],
      ] as [number, number][]
    ).find((point) => !inside(box, point));
    if (!pastPopup) throw new Error(`The ${bar} must show past the ${name}`);
    expect(document.elementFromPoint(...pastPopup), `${name} backdrop over the ${bar}`).toBe(
      backdrop,
    );
  }
}
