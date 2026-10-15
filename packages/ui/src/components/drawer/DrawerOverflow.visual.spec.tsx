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

/** `inner` lies inside `outer` and inside the viewport. */
function expectInView(outer: Element, inner: Element) {
  const o = boxOf(outer);
  const i = boxOf(inner);
  expect(i.top).toBeGreaterThanOrEqual(Math.max(o.top, 0));
  expect(i.bottom).toBeLessThanOrEqual(Math.min(o.bottom, window.innerHeight));
}

describeMotionPaths("Drawer with a Body", () => {
  it.each(["left", "right", "bottom"] as const)(
    "keeps the title and actions in view and scrolls only the body (%s)",
    async (side) => {
      // Nothing tabbable above the Body, the actions below it
      render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Backdrop />
            <Drawer.Popup side={side} data-testid="popup">
              <Drawer.Title>Settings</Drawer.Title>
              <Drawer.Body>
                <div style={{ height: 2000 }} />
              </Drawer.Body>
              <div>
                <Drawer.Close>Cancel</Drawer.Close>
                <button type="button">Save</button>
              </div>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      const popup = await screen.findByTestId("popup");
      const box = await waitForStable(() => boxOf(popup));
      const body = screen.getByRole("region", { name: "Settings" });
      const title = screen.getByRole("heading", { name: "Settings" });
      const save = screen.getByRole("button", { name: "Save" });

      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      // The body is the first tab stop, so it takes the initial focus, scrolled to its top
      await expect.element(body).toHaveFocus();
      expect(body.scrollTop).toBe(0);
      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      expect(popup.scrollHeight).toBe(popup.clientHeight);
      expectInView(popup, title);
      expectInView(popup, save);

      await userEvent.keyboard("{End}");
      await expect.poll(() => body.scrollTop).toBe(body.scrollHeight - body.clientHeight);
      expect(popup.scrollTop).toBe(0);
      expectInView(popup, title);
      expectInView(popup, save);
    },
  );
});
