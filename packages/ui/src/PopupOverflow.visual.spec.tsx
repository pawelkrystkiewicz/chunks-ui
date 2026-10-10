import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { Combobox } from "./components/combobox";
import { Menu } from "./components/menu";
import { reloadMotion } from "./lib/use-motion";
import { boxOf, describeMotionPaths, eachPaintedFrame, waitForStable } from "./VisualTest.utils";

// More items than fit below the trigger in the test viewport. No screenshots are taken.
const items = Array.from({ length: 80 }, (_, i) => `Item ${i + 1}`);

const ui = (children: ReactNode) => <div style={{ padding: 40 }}>{children}</div>;

const CASES = [
  {
    name: "Combobox",
    node: ui(
      <Combobox.Root items={items}>
        <Combobox.Input aria-label="Item" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    ),
    trigger: () => screen.getByRole("combobox", { name: "Item" }),
    itemRole: "option",
    // ArrowUp from no highlight wraps to the last item
    key: "{ArrowUp}",
  },
  {
    name: "Menu",
    node: ui(
      <Menu.Root>
        <Menu.Trigger>Options</Menu.Trigger>
        <Menu.Content data-testid="popup">
          {items.map((item) => (
            <Menu.Item key={item}>{item}</Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Root>,
    ),
    trigger: () => screen.getByRole("button", { name: "Options" }),
    itemRole: "menuitem",
    key: "{End}",
  },
];

describe.each(CASES)("$name with many items", ({ name, node, trigger, itemRole, key }) => {
  describeMotionPaths(name, () => {
    it("stays inside the viewport and scrolls the highlighted item into view at the end", async () => {
      render(node);
      await userEvent.click(trigger());
      const popup = await screen.findByTestId("popup");
      await waitForStable(() => boxOf(popup));

      await userEvent.keyboard(key);
      const last = screen.getByRole(itemRole, { name: "Item 80" });
      await expect.poll(() => last.hasAttribute("data-highlighted")).toBe(true);

      // The items scroll inside the popup, which stays where it opened
      const item = await waitForStable(() => boxOf(last));
      const box = boxOf(popup);
      expect(item.top).toBeGreaterThanOrEqual(box.top);
      expect(item.bottom).toBeLessThanOrEqual(box.bottom);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
  });

  describe("without Motion", () => {
    afterEach(async () => {
      await commands.emulateMedia({ reducedMotion: "reduce" });
      await reloadMotion();
    });

    it("keeps its height from the first painted frame", async () => {
      // CSS transition fallback: Motion never arrives, and reduced motion is off
      void reloadMotion(new Promise(() => {}));
      await commands.emulateMedia({ reducedMotion: "no-preference" });
      await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
      render(node);

      const heights = eachPaintedFrame(
        // Layout height, so the opening scale doesn't count
        () =>
          (document.querySelector('[data-testid="popup"]') as HTMLElement | null)?.offsetHeight ??
          null,
        40,
      );
      await userEvent.click(trigger());
      const popup = document.querySelector('[data-testid="popup"]') as HTMLElement;
      // Base UI rewrites --available-height as the space changes (viewport resize, scroll):
      // the CSS fallback must not animate the max-height that follows it
      const animated = getComputedStyle(popup)
        .transitionProperty.split(",")
        .map((p) => p.trim());
      expect(animated).not.toContain("all");

      const painted = (await heights).filter((height) => height !== null);

      expect(painted.length).toBeGreaterThan(0);
      // Fits the viewport on every frame, and is not still resizing from another height
      expect(Math.max(...painted)).toBeLessThanOrEqual(window.innerHeight);
      expect(new Set(painted).size).toBe(1);
    });
  });
});
