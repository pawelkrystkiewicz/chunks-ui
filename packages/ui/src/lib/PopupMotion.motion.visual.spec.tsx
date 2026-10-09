import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Tooltip } from "../components/tooltip";
import { reloadMotion } from "./use-motion";

// Runs with reduced motion off, so the popups animate with Motion instead of CSS
const popups = {
  Dialog: (open: boolean, keepMounted?: boolean) => (
    <Dialog.Root open={open}>
      <Dialog.Portal keepMounted={keepMounted}>
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Dialog</Dialog.Title>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  Drawer: (open: boolean, keepMounted?: boolean) => (
    <Drawer.Root open={open}>
      <Drawer.Portal keepMounted={keepMounted}>
        <Drawer.Popup data-testid="popup">
          <Drawer.Title>Drawer</Drawer.Title>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  Tooltip: (open: boolean, keepMounted?: boolean) => (
    <Tooltip.Root open={open}>
      <Tooltip.Trigger>Tooltip</Tooltip.Trigger>
      <Tooltip.Portal keepMounted={keepMounted}>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="popup">Tooltip</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  ),
  Popover: (open: boolean) => (
    <Popover.Root open={open}>
      <Popover.Trigger>Popover</Popover.Trigger>
      <Popover.Content data-testid="popup">Popover</Popover.Content>
    </Popover.Root>
  ),
  Menu: (open: boolean) => (
    <Menu.Root open={open}>
      <Menu.Trigger>Menu</Menu.Trigger>
      <Menu.Content data-testid="popup">
        <Menu.Item>Item</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  ),
} satisfies Record<string, (open: boolean, keepMounted?: boolean) => ReactNode>;

type Name = keyof typeof popups;

const popup = () => document.querySelector<HTMLElement>('[data-testid="popup"]');
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

// Share of the element's box that is inside the viewport
function visibleShare(element: HTMLElement | null) {
  if (!element) return 0;
  const box = element.getBoundingClientRect();
  const width = Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0));
  const height = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
  return (width * height) / (box.width * box.height);
}

async function renderClosed(name: Name, keepMounted?: boolean) {
  await import("motion/react");
  const result = render(popups[name](false, keepMounted));
  // Popups switch to Motion after it loads, which is after the first render
  await new Promise((resolve) => setTimeout(resolve, 100));
  return result;
}

describe("popups animated with Motion", () => {
  it.each(Object.keys(popups) as Name[])(
    "mounts a %s when it opens and unmounts it once closed",
    async (name) => {
      const { rerender } = await renderClosed(name);
      expect(popup()).toBeNull();

      rerender(popups[name](true));
      await expect.poll(popup).not.toBeNull();
      // Motion drives it: the animated values are inline styles, not CSS transitions
      expect(popup()?.style.transform).not.toBe("");

      rerender(popups[name](false));
      await expect.poll(popup, { timeout: 3000 }).toBeNull();
    },
  );

  it.each(["Dialog", "Tooltip", "Popover", "Menu"] as const)(
    "plays the %s exit animation before unmounting",
    async (name) => {
      const { rerender } = await renderClosed(name);
      rerender(popups[name](true));
      await expect.poll(() => popup()?.style.opacity).toBe("1");

      rerender(popups[name](false));
      const opacities: number[] = [];
      for (let element = popup(), frame = 0; element && frame < 120; element = popup(), frame++) {
        // Computed, since Motion runs opacity as a browser animation rather than inline style
        opacities.push(Number(getComputedStyle(element).opacity));
        await nextFrame();
      }
      expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
    },
  );

  it.each(["left", "right", "bottom"] as const)(
    "keeps a %s Drawer mounted until it has slid out",
    async (side) => {
      const drawer = (open: boolean) => (
        <Drawer.Root open={open}>
          <Drawer.Portal>
            <Drawer.Popup side={side} data-testid="popup">
              <Drawer.Title>Drawer</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      );
      await import("motion/react");
      const { rerender } = render(drawer(false));
      rerender(drawer(true));
      await expect.poll(() => visibleShare(popup())).toBeGreaterThan(0.99);

      rerender(drawer(false));
      const shares: number[] = [];
      for (let element = popup(), frame = 0; element && frame < 180; element = popup(), frame++) {
        shares.push(visibleShare(element));
        await nextFrame();
      }
      expect(popup()).toBeNull();
      // It slides: some frames show it partly off-screen, and it leaves the DOM once it is out
      expect(shares.some((share) => share > 0 && share < 0.99)).toBe(true);
      expect(shares.at(-1)).toBeLessThan(0.05);
    },
  );

  it.each(["Dialog", "Drawer", "Tooltip"] as const)(
    "keeps a closed %s mounted when keepMounted is set",
    async (name) => {
      await renderClosed(name, true);
      expect(popup()).not.toBeNull();
    },
  );
});

const openPopups = {
  Dialog: (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Dialog</Dialog.Title>
          <input aria-label="Name" />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  Popover: (
    <Popover.Root defaultOpen>
      <Popover.Trigger>Popover</Popover.Trigger>
      <Popover.Content data-testid="popup">
        <input aria-label="Name" />
      </Popover.Content>
    </Popover.Root>
  ),
  Menu: (
    <Menu.Root defaultOpen>
      <Menu.Trigger>Menu</Menu.Trigger>
      <Menu.Content data-testid="popup">
        <Menu.Item>Item</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  ),
};

// Motion's import settles in a later task, so the synchronous steps after render() run while
// it is still loading; user events would await past that point
describe("popups open while Motion loads", () => {
  async function renderWhileMotionLoads(ui: ReactNode) {
    const loading = reloadMotion();
    render(ui);
    const node = popup();
    // Opened before Motion arrived: no inline styles from a motion.div
    expect(node?.style.opacity).toBe("");
    return {
      node,
      async motionLoaded() {
        await loading;
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    };
  }

  it.each(Object.keys(openPopups) as (keyof typeof openPopups)[])(
    "keeps an open %s's node and focus when Motion finishes loading",
    async (name) => {
      const { node, motionLoaded } = await renderWhileMotionLoads(openPopups[name]);
      // What Base UI focuses on open: the first tabbable element, else the popup
      const focused = node?.querySelector("input") ?? node;
      focused?.focus();
      expect(document.activeElement).toBe(focused);

      await motionLoaded();
      expect(popup()).toBe(node);
      expect(document.activeElement).toBe(focused);
    },
  );

  it("keeps text typed into an open Dialog when Motion finishes loading", async () => {
    const { node, motionLoaded } = await renderWhileMotionLoads(openPopups.Dialog);
    const input = node?.querySelector("input");
    if (input) input.value = "Ada";

    await motionLoaded();
    await expect.element(page.getByRole("textbox", { name: "Name" })).toHaveValue("Ada");
  });
});
