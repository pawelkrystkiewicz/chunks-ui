import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { boxOf, waitForStable } from "../../VisualTest.utils";
import { Drawer } from "../drawer";
import { Dialog } from "./index";

// Geometry only, no screenshots: the real measurement behind the Body's tab stop, which the
// jsdom suite (OverlayBody.spec.tsx) shims.

// Drawer parts are Dialog parts, so one suite serves both Bodies
const OVERLAYS = [
  { name: "Dialog.Body", X: Dialog },
  { name: "Drawer.Body", X: Drawer },
] as const;

describe.each(OVERLAYS)("$name", ({ X }) => {
  /** A Popup with the Body's `content` between the Title and the actions */
  function overlay(content: number) {
    return (
      <X.Root defaultOpen>
        <X.Portal>
          <X.Backdrop />
          <X.Popup data-testid="popup">
            <X.Title>Terms</X.Title>
            <X.Body>
              <div style={{ height: content }} />
            </X.Body>
            <div>
              <X.Close>Cancel</X.Close>
            </div>
          </X.Popup>
        </X.Portal>
      </X.Root>
    );
  }

  async function open(content: number) {
    const result = render(overlay(content));
    const popup = await screen.findByTestId("popup");
    await waitForStable(() => boxOf(popup));
    return { ...result, body: screen.getByRole("region", { name: "Terms" }) };
  }

  it("is a tab stop and takes the initial focus when its content is taller than its box", async () => {
    const { body } = await open(2000);
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    expect(body).toHaveAttribute("tabindex", "0");
    await expect.element(body).toHaveFocus();
  });

  it("is skipped, and the first action takes the initial focus, when its content fits", async () => {
    const { body } = await open(40);
    expect(body.scrollHeight).toBe(body.clientHeight);
    expect(body).not.toHaveAttribute("tabindex");
    await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("becomes a tab stop when its content grows past its box, and stops being one when it shrinks", async () => {
    const { body, rerender } = await open(40);
    expect(body).not.toHaveAttribute("tabindex");

    rerender(overlay(2000));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("0");

    rerender(overlay(40));
    await expect.poll(() => body.hasAttribute("tabindex")).toBe(false);
  });
});
