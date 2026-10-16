import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emulateReducedMotion, waitForStable } from "../../VisualTest.utils";
import { Toast } from "./index";

/*
 * The opt-in stack (theme.css `.toast-stack`) positions its toasts with `transform` and
 * transitions that, unlayered, over the Toast.Root utilities. Toast.Root slides in and out along
 * `translate` (W111, #383): with that utility still applying, a closing stacked toast jumped to
 * the inline end at once, as `translate` was in no transition list, and its slide was lost.
 */
describe("Toast stack with motion allowed", () => {
  beforeAll(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  it("slides a closing toast out instead of dropping it at once", async () => {
    const manager = Toast.createToastManager();
    render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport className="toast-stack-viewport" />
      </Toast.Provider>,
    );
    await screen.findByRole("region", { name: /Notifications/ });
    for (const n of [1, 2, 3]) {
      manager.add({ id: `toast-${n}`, title: `Toast ${n}`, timeout: 0, className: "toast-stack" });
    }
    const toast = (await screen.findByText("Toast 3")).closest(".Toast") as HTMLElement;
    await expect.poll(() => getComputedStyle(toast).opacity).toBe("1");
    const home = await waitForStable(() => {
      const { left, top } = toast.getBoundingClientRect();
      return { left, top };
    });
    // Read now: once the toast has left the page, it has no height
    const height = toast.offsetHeight;

    // Its box on the first frame styled for the exit, read as the ending attribute lands
    let atEnding: { dx: number; dy: number } | undefined;
    const observer = new MutationObserver(() => {
      if (atEnding || toast.dataset.endingStyle === undefined) return;
      const box = toast.getBoundingClientRect();
      atEnding = { dx: box.left - home.left, dy: box.top - home.top };
    });
    observer.observe(toast, { attributes: true, attributeFilter: ["data-ending-style"] });
    manager.close("toast-3");

    // The farthest it gets from where it sat, down and across
    let down = 0;
    let across = 0;
    await expect
      .poll(() => {
        if (toast.isConnected) {
          const box = toast.getBoundingClientRect();
          down = Math.max(down, box.top - home.top);
          across = Math.max(across, Math.abs(box.left - home.left));
        }
        return toast.isConnected;
      })
      .toBe(false);
    observer.disconnect();
    expect(atEnding).toBeDefined();
    // Starts from where it sat, and slides out below, as it slid in
    expect(Math.abs(atEnding?.dx ?? 0)).toBeLessThan(1);
    expect(Math.abs(atEnding?.dy ?? 0)).toBeLessThan(1);
    expect(down).toBeGreaterThan(height * 0.9);
    expect(across).toBeLessThan(1);
  });
});
