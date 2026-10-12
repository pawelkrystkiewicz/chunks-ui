import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { enterMotionPath, renderPage } from "../../VisualTest.utils";
import { Drawer } from "./index";

describe("Drawer", () => {
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

/** `--ring` as the browser computes it for an outline colour */
function ringColor() {
  const probe = document.createElement("span");
  probe.style.outlineColor = "var(--ring)";
  document.body.append(probe);
  const color = getComputedStyle(probe).outlineColor;
  probe.remove();
  return color;
}

function ringOf(element: Element) {
  const { outlineStyle, outlineWidth, outlineOffset, outlineColor } = getComputedStyle(element);
  return { outlineStyle, outlineWidth, outlineOffset, outlineColor };
}

const SIDES = ["left", "right", "bottom"] as const;

async function emulateReducedMotion(reducedMotion: "reduce" | "no-preference") {
  await commands.emulateMedia({ reducedMotion });
  await expect
    .poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    .toBe(reducedMotion === "reduce");
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
  beforeEach(() => emulateReducedMotion(reducedMotion));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(SIDES)(
    "draws the whole inset ring from the moment the popup takes focus (%s)",
    async (side) => {
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
              <Drawer.Popup side={side} data-testid="popup">
                <Drawer.Title>Drawer Title</Drawer.Title>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>,
        );
        await expect.poll(() => rings.length).toBeGreaterThan(0);
      } finally {
        document.removeEventListener("focusin", onFocus);
      }
      // Inside the popup's edge, so the border on the open side still shows
      expect(rings[0]).toEqual({
        focusVisible: true,
        outlineStyle: "solid",
        outlineWidth: "2px",
        outlineOffset: "-2px",
        outlineColor: ringColor(),
      });
    },
  );
});

// Share of the element's box that is inside the viewport
function visibleShare(element: Element) {
  const box = element.getBoundingClientRect();
  const width = Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0));
  const height = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
  return (width * height) / (box.width * box.height);
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("Drawer.Popup CSS fallback with no reduced-motion preference", () => {
  beforeAll(() => enterMotionPath(false));
  beforeEach(() => emulateReducedMotion("no-preference"));
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(SIDES)("slides a %s drawer in", async (side) => {
    const drawer = (open: boolean) => (
      <Drawer.Root open={open}>
        <Drawer.Portal>
          <Drawer.Popup side={side} data-testid="popup">
            <Drawer.Title>Drawer Title</Drawer.Title>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    );
    const { rerender } = render(drawer(false));
    rerender(drawer(true));
    const popup = await screen.findByTestId("popup");
    expect(popup).toHaveClass("micro-interactions");
    const shares: number[] = [];
    for (let frame = 0; frame < 60; frame++) {
      shares.push(visibleShare(popup));
      await nextFrame();
    }
    // Some frames show it partly off-screen, and it ends inside the viewport
    expect(shares.some((share) => share > 0.01 && share < 0.99)).toBe(true);
    expect(shares.at(-1)).toBeGreaterThan(0.99);
  });
});
