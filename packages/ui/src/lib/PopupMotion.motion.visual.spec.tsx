import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Tooltip } from "../components/tooltip";

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

  it.each(["Dialog", "Drawer", "Tooltip"] as const)(
    "keeps a closed %s mounted when keepMounted is set",
    async (name) => {
      await renderClosed(name, true);
      expect(popup()).not.toBeNull();
    },
  );
});
