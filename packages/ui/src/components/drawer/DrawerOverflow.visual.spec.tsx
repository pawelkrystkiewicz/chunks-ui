import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { boxOf, describeMotionPaths, waitForStable } from "../../VisualTest.utils";
import { Drawer } from "./index";

// Geometry only, no screenshots. Both paths: the CSS variants (reduced motion) and the Motion
// springs, which position the popup with their own classes.
describeMotionPaths("Drawer with content taller than the viewport", () => {
  it.each(["left", "right", "bottom"] as const)(
    "stays inside the viewport and scrolls to the control focus moves to (%s)",
    async (side) => {
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

      await userEvent.tab();
      const save = screen.getByRole("button", { name: "Save" });
      await expect.element(save).toHaveFocus();
      const button = await waitForStable(() => boxOf(save));
      expect(button.top).toBeGreaterThanOrEqual(box.top);
      expect(button.bottom).toBeLessThanOrEqual(box.bottom);
    },
  );
});
