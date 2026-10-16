import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { type PopupPartName, popupParts } from "./PopupRender.fixtures";
import { reloadMotion } from "./use-motion";

// vitest.setup.ts stubs matchMedia; a test swaps in a query that reports reduced motion
const { matchMedia } = window;

afterEach(() => {
  cleanup();
  window.matchMedia = matchMedia;
});

// The style Motion writes inline from a part's `from` values, as [property, value]. Most parts fade;
// the drawer slides, so Motion writes a transform and the CSS path a translate.
const inline: Partial<Record<PopupPartName, ["opacity" | "transform", string]>> = {
  "Drawer.Popup": ["transform", "translateY(100%)"],
};

describe.each(popupParts)("$part with Motion loaded", ({ part, ui }) => {
  const [property, closed] = inline[part] ?? ["opacity", "0"];

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).not.toHaveClass("micro-interactions");
    // A motion.div renders its initial values inline: the part's `from`, not its `to`
    expect(el.style[property]).toBe(closed);
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    render(ui(<section />));
    const el = screen.getByTestId("popup");
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveClass("micro-interactions");
  });

  // The user's preference is read live and wins over a loaded Motion
  it("keeps the CSS transition for a user who prefers reduced motion", async () => {
    window.matchMedia = () =>
      ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList;
    await reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).toHaveClass("micro-interactions");
  });

  // The Motion choice is frozen at mount: a part that opened on CSS keeps its element when Motion arrives
  it("keeps its element when Motion finishes loading after it opened", async () => {
    const loading = reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).toHaveClass("micro-interactions");
    await act(() => loading);
    expect(screen.getByTestId("popup")).toBe(el);
  });
});
