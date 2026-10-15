import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { Combobox } from "../components/combobox";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { Tooltip } from "../components/tooltip";
import { enterMotionPath } from "../VisualTest.utils";

type Row = {
  part: string;
  /** Mounts the part open as `data-testid="popup"`, with a consumer `render` when given one. */
  ui: (renderProp?: ReactElement) => ReactNode;
  /** The computed `transition-property` of the part's CSS path, from its component file. */
  transitions: string;
  /** The style Motion writes inline on the default element, from the part's `from` values. */
  inline: "opacity" | "transform";
};

/** `micro-interactions [transition-property:opacity,scale]`: the fade and scale of the spring path */
const FADE_SCALE = "opacity, scale";

/** Bare `micro-interactions`: `all`, then the outline entries the theme adds so rings show at once */
const ALL = "all, outline, outline-offset";

// The nine popup parts that pick Motion or CSS through usePopupRender; the JSX shapes are those of
// the jsdom table in UsePopupRender.spec.tsx, which proves the class list this spec sees run
const parts: Row[] = [
  {
    part: "Dialog.Backdrop",
    transitions: ALL,
    inline: "opacity",
    ui: (r) => (
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Backdrop render={r} data-testid="popup" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    part: "Dialog.Popup",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup render={r} data-testid="popup">
            Content
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    part: "Drawer.Backdrop",
    transitions: ALL,
    inline: "opacity",
    ui: (r) => (
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop render={r} data-testid="popup" />
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    // One side: `cssSlide` in Drawer.Variants.ts is on the base, shared by the three sides
    part: "Drawer.Popup",
    transitions: "translate",
    inline: "transform",
    ui: (r) => (
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup side="bottom" render={r} data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    part: "Popover.Content",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content render={r} data-testid="popup">
          Content
        </Popover.Content>
      </Popover.Root>
    ),
  },
  {
    part: "Menu.Content",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content render={r} data-testid="popup">
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    ),
  },
  {
    part: "Tooltip.Popup",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup render={r} data-testid="popup">
              Tip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
  {
    part: "Select.Popup",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup render={r} data-testid="popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>
    ),
  },
  {
    part: "Combobox.Popup",
    transitions: FADE_SCALE,
    inline: "transform",
    ui: (r) => (
      <Combobox.Root open items={["apple"]}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup render={r} data-testid="popup">
              <Combobox.List>{(item) => <Combobox.Item key={item} value={item} />}</Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
];

/**
 * Parts whose default element PopupMotion.motion.visual.spec.tsx already shows Motion animating
 * ("mounts a %s when it opens": an inline transform from the motion.div). The rest get that
 * proof here, so each of the nine has both halves of the contract in a browser.
 */
const DEFAULT_PROVEN_ELSEWHERE = new Set([
  "Dialog.Popup",
  "Drawer.Popup",
  "Popover.Content",
  "Menu.Content",
  "Tooltip.Popup",
]);

const transitionOf = (el: Element) => {
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
    "$part runs the CSS transition on the element a render prop gives it",
    async ({ ui, transitions }) => {
      render(ui(<section />));
      const el = await screen.findByTestId("popup");
      expect(el.tagName).toBe("SECTION");
      // Nothing from a motion.div
      expect({ transform: el.style.transform, opacity: el.style.opacity }).toEqual({
        transform: "",
        opacity: "",
      });
      // A positioned popup carries `transition: none` inline for its starting frame (Base UI's
      // getDisabledMountTransitionStyles), so the list reads `none` until the next frame
      await expect.poll(() => transitionOf(el).transitionProperty).toBe(transitions);
      expect(transitionOf(el).transitionDuration).not.toBe("0s");
    },
  );

  it.each(parts.filter(({ part }) => !DEFAULT_PROVEN_ELSEWHERE.has(part)))(
    "$part animates its default element with Motion, not CSS",
    async ({ ui, inline }) => {
      render(ui());
      const el = await screen.findByTestId("popup");
      // A motion.div renders the part's `from` values inline
      expect(el.style[inline]).not.toBe("");
      // No CSS transition is left to run alongside the spring
      await expect.poll(() => transitionOf(el).transitionDuration).toBe("0s");
    },
  );
});
