import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { boxOf, waitForStable } from "../../VisualTest.utils";
import { Drawer } from "../drawer";
import { Dialog } from "./index";

// Geometry only, no screenshots: the real measurement behind the Body's tab stop, which the
// jsdom suite (OverlayBody.spec.tsx) shims.

describe("Dialog.Body", () => {
  /** A Popup with the Body's `content` between the Title and the actions */
  function overlay(content: number) {
    return (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup data-testid="popup">
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body>
              <div style={{ height: content }} />
            </Dialog.Body>
            <div>
              <Dialog.Close>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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
    expect(body).toHaveAttribute("tabindex", "-1");
    await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("becomes a tab stop when its content grows past its box, and stops being one when it shrinks", async () => {
    const { body, rerender } = await open(40);
    expect(body).toHaveAttribute("tabindex", "-1");

    rerender(overlay(2000));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("0");

    rerender(overlay(40));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("-1");
  });

  it("keeps the focus when its content shrinks to fit", async () => {
    // Removing `tabindex` from the focused element drops the focus to <body>; -1 keeps it
    const { body, rerender } = await open(2000);
    await expect.element(body).toHaveFocus();

    rerender(overlay(40));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("-1");
    expect(body).toHaveFocus();
  });

  it("takes the initial focus when a keepMounted popup opens from its Trigger", async () => {
    // The Body mounts hidden, so its first measurement finds nothing to scroll; opening re-renders
    // the popup, not the Body
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal keepMounted>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Terms</Dialog.Title>
            <Dialog.Body>
              <div style={{ height: 2000 }} />
            </Dialog.Body>
            <div>
              <Dialog.Close>Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const body = await screen.findByRole("region", { name: "Terms" });
    await expect.element(body).toHaveFocus();
    expect(body).toHaveAttribute("tabindex", "0");
  });
});

// In a left or right drawer the Body is `flex-1`: its box is the same whatever its content, so
// only the content itself can report that it grew
describe("Drawer.Body in a side drawer", () => {
  /** A direct child of the Body that grows on its own, as an image or a list that loads does */
  function Growing() {
    const [tall, setTall] = useState(false);
    return (
      <div style={{ height: tall ? 2000 : 40 }}>
        <button type="button" onClick={() => setTall(true)}>
          Grow
        </button>
      </div>
    );
  }

  it("becomes a tab stop when a child grows on its own, without a render of the Body", async () => {
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup data-testid="popup">
            <Drawer.Title>Terms</Drawer.Title>
            <Drawer.Body>
              <Growing />
            </Drawer.Body>
            <div>
              <Drawer.Close>Cancel</Drawer.Close>
            </div>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const popup = await screen.findByTestId("popup");
    await waitForStable(() => boxOf(popup));
    const body = screen.getByRole("region", { name: "Terms" });
    expect(body).toHaveAttribute("tabindex", "-1");

    const { clientHeight } = body;
    await userEvent.click(screen.getByRole("button", { name: "Grow" }));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("0");
    // The box did not change, so the child's own report measured the Body
    expect(body.clientHeight).toBe(clientHeight);
  });
});
