import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { reloadMotion } from "../../lib/use-motion";
import { waitForStable } from "../../VisualTest.utils";
import { Drawer } from "./index";

// Geometry only, no screenshots. Both paths: the CSS variants (reduced motion) and the Motion
// springs, which position the popup with their own classes.
const CASES = (["left", "right", "bottom"] as const).flatMap((side) =>
  (["reduce", "no-preference"] as const).map((reducedMotion) => ({ side, reducedMotion })),
);

const boxOf = (el: Element) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  return { top, bottom, left, right };
};

describe("Drawer with content taller than the viewport", () => {
  // Motion loaded before the popup opens, so the no-preference cases run the spring path
  beforeAll(() => reloadMotion());
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  it.each(CASES)(
    "stays inside the viewport and scrolls to the control focus moves to ($side, reduced motion: $reducedMotion)",
    async ({ side, reducedMotion }) => {
      await commands.emulateMedia({ reducedMotion });
      // Close at the top takes the initial focus, Save sits after the content
      render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Backdrop />
            <Drawer.Popup side={side} data-testid="popup">
              <Drawer.Title>Settings</Drawer.Title>
              <Drawer.Close>Close</Drawer.Close>
              <div style={{ height: 2000 }} />
              <button type="button">Save</button>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      const popup = await screen.findByTestId("popup");
      const box = await waitForStable(() => boxOf(popup));

      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      const title = boxOf(screen.getByRole("heading", { name: "Settings" }));
      expect(title.top).toBeGreaterThanOrEqual(box.top);

      await userEvent.tab();
      const save = screen.getByRole("button", { name: "Save" });
      await expect.element(save).toHaveFocus();
      const button = await waitForStable(() => boxOf(save));
      expect(button.top).toBeGreaterThanOrEqual(box.top);
      expect(button.bottom).toBeLessThanOrEqual(box.bottom);
    },
  );
});
