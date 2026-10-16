import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  emulateReducedMotion,
  enterMotionPath,
  renderPage,
  ringColor,
  withViewport,
} from "../../VisualTest.utils";
import { Drawer } from "./index";

describe("Drawer", () => {
  // The page is 640 × 480, kept as it was: the existing baselines use this size
  withViewport(640, 480);

  it("right", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="right">
            <Drawer.Title>Drawer Title</Drawer.Title>
            <Drawer.Description>Right side drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("left", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="left">
            <Drawer.Title>Left Drawer</Drawer.Title>
            <Drawer.Description>Left side drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("bottom", async () => {
    const body = await renderPage(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="bottom">
            <Drawer.Title>Bottom Drawer</Drawer.Title>
            <Drawer.Description>Bottom drawer content.</Drawer.Description>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    await expect(body).toMatchScreenshot();
  });
});

function ringOf(element: Element) {
  const { outlineStyle, outlineWidth, outlineOffset, outlineColor } = getComputedStyle(element);
  return { outlineStyle, outlineWidth, outlineOffset, outlineColor };
}

/**
 * Reduced motion uses the CSS variants with no transition. With no preference, Motion slides the
 * popup, or, when Motion never arrives, the CSS variants' transition does.
 */
const PATHS = [
  { path: "reduced motion", reducedMotion: "reduce", withMotion: true },
  { path: "Motion", reducedMotion: "no-preference", withMotion: true },
  { path: "CSS fallback", reducedMotion: "no-preference", withMotion: false },
] as const;

describe.each(PATHS)("Drawer.Popup focus ring, $path", ({ reducedMotion, withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(reducedMotion === "reduce"));
  afterAll(() => emulateReducedMotion(true));

  // One side: the sides share one ring class
  it("draws the whole inset ring from the moment the popup takes focus, clear of the border", async () => {
    // Read in the focus event, so a transition on the ring would still be at its start
    const rings: (ReturnType<typeof ringOf> & { focusVisible: boolean })[] = [];
    const onFocus = ({ target }: FocusEvent) => {
      if (target instanceof HTMLElement && target.dataset.testid === "popup") {
        rings.push({ focusVisible: target.matches(":focus-visible"), ...ringOf(target) });
      }
    };
    document.addEventListener("focusin", onFocus);
    try {
      // Nothing tabbable inside, so Base UI focuses the popup
      render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup side="right" data-testid="popup">
              <Drawer.Title>Drawer Title</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(() => rings.length).toBeGreaterThan(0);
    } finally {
      document.removeEventListener("focusin", onFocus);
    }
    // Inside the popup's edge, past the border on the open side, so the border still shows
    expect(rings[0]).toEqual({
      focusVisible: true,
      outlineStyle: "solid",
      outlineWidth: "2px",
      outlineOffset: "-3px",
      outlineColor: ringColor(),
    });
    const popup = await screen.findByTestId("popup");
    const style = getComputedStyle(popup);
    const border = Number.parseFloat(style.borderLeftWidth);
    expect(border).toBeGreaterThan(0);
    // The ring starts where the offset box ends: at least the border width inside the edge
    expect(-Number.parseFloat(style.outlineOffset)).toBeGreaterThanOrEqual(border);
  });
});

describe("Drawer.Popup CSS fallback with no reduced-motion preference", () => {
  beforeAll(() => enterMotionPath(false));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  it("slides the popup with a CSS transition", async () => {
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup side="right" data-testid="popup">
            <Drawer.Title>Drawer Title</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const popup = await screen.findByTestId("popup");
    expect(popup).toHaveClass("micro-interactions");
    const style = getComputedStyle(popup);
    expect(style.transitionProperty).toBe("translate");
    expect(style.transitionDuration).not.toBe("0s");
  });
});
