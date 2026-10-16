import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { enterMotionPath, MOTION_PATHS } from "../VisualTest.utils";
import { type PopupPartName, popupParts } from "./PopupRender.fixtures";

type Css = {
  /** The computed `transition-property` of the part's CSS path, from its component file. */
  transitions: string;
  /** The computed `transition-duration`, one entry per property in `transitions` */
  duration: string;
  /** The style Motion writes inline on the default element, from the part's `from` values. */
  inline: "opacity" | "transform";
  /** Anchored to a trigger, so it scales from its Positioner's `--transform-origin` */
  anchored?: true;
};

/** `micro-interactions [transition-property:opacity,scale]`: the fade and scale of the spring path */
const FADE_SCALE = "opacity, scale";

/** Bare `micro-interactions`: `all`, then the outline entries the theme adds so rings show at once */
const MICRO_INTERACTIONS_LIST = "all, outline, outline-offset";

// Per part of the shared table, whose class list UsePopupRender.spec.tsx proves in jsdom
const css: Record<PopupPartName, Css> = {
  "Dialog.Backdrop": {
    transitions: MICRO_INTERACTIONS_LIST,
    duration: "0.3s, 0s, 0s",
    inline: "opacity",
  },
  "Dialog.Popup": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
  },
  "Drawer.Backdrop": {
    transitions: MICRO_INTERACTIONS_LIST,
    duration: "0.3s, 0s, 0s",
    inline: "opacity",
  },
  "Drawer.Popup": {
    transitions: "translate",
    duration: "0.3s",
    inline: "transform",
  },
  "Popover.Content": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
    anchored: true,
  },
  "Menu.Content": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
    anchored: true,
  },
  "Tooltip.Popup": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
    anchored: true,
  },
  "Select.Popup": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
    anchored: true,
  },
  "Combobox.Popup": {
    transitions: FADE_SCALE,
    duration: "0.3s",
    inline: "transform",
    anchored: true,
  },
};

const parts = popupParts.map((row) => ({ ...row, ...css[row.part] }));

const computedTransition = (el: Element) => {
  const { transitionProperty, transitionDuration } = getComputedStyle(el);
  return { transitionProperty, transitionDuration };
};

describe("popup parts with Motion loaded, no reduced-motion preference", () => {
  beforeAll(() => enterMotionPath(true));
  beforeEach(async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
  });
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  // The element `render` gives the part replaces the one the spring would animate
  it.each(parts)(
    "$part has the CSS transition on the element a render prop gives it",
    async ({ ui, transitions, duration }) => {
      render(ui(<section />));
      const el = await screen.findByTestId("popup");
      expect(el.tagName).toBe("SECTION");
      // Nothing from a motion.div
      expect({ transform: el.style.transform, opacity: el.style.opacity }).toEqual({
        transform: "",
        opacity: "",
      });
      expect(computedTransition(el)).toEqual({
        transitionProperty: transitions,
        transitionDuration: duration,
      });
    },
  );

  it.each(parts)(
    "$part animates its default element with Motion, not CSS",
    async ({ ui, inline }) => {
      render(ui());
      const el = await screen.findByTestId("popup");
      // A motion.div renders the part's `from` values inline
      expect(el.style[inline]).not.toBe("");
      // No CSS transition is left to run alongside the spring
      expect(computedTransition(el).transitionDuration).toBe("0s");
    },
  );
});

// Base UI publishes `--transform-origin` on the Positioner once it has placed the popup: the point
// on the trigger's side, so the popup grows out of its trigger. Dialog and Drawer have no anchor.
describe.each(MOTION_PATHS)("anchored popup parts, $path", ({ withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
  });
  afterAll(async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await enterMotionPath(true);
  });

  it.each(parts.filter((row) => row.anchored))(
    "$part scales from its Positioner's --transform-origin",
    async ({ ui }) => {
      render(ui());
      const popup = await screen.findByTestId("popup");
      const positioner = popup.parentElement as HTMLElement;
      const origin = () => positioner.style.getPropertyValue("--transform-origin");
      await expect.poll(origin).not.toBe("");
      // Which path scales it: Motion writes the scale inline, and leaves the origin to the class
      expect(popup.style.transform !== "").toBe(withMotion);
      expect(popup.style.transformOrigin).toBe("");

      const computed = getComputedStyle(popup).transformOrigin;
      // The Positioner's value set on the popup, so its percentages resolve against the same box
      popup.style.transformOrigin = origin();
      const fromPositioner = getComputedStyle(popup).transformOrigin;
      popup.style.removeProperty("transform-origin");
      expect(computed).toBe(fromPositioner);
    },
  );
});
