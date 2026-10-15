import { render, screen } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
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

  it("takes the initial focus when a keepMounted popup opens from its Trigger", async () => {
    // The Body mounts hidden, so its first measurement finds nothing to scroll; opening re-renders
    // the popup, not the Body
    render(
      <X.Root>
        <X.Trigger>Open</X.Trigger>
        <X.Portal keepMounted>
          <X.Backdrop />
          <X.Popup>
            <X.Title>Terms</X.Title>
            <X.Body>
              <div style={{ height: 2000 }} />
            </X.Body>
            <div>
              <X.Close>Cancel</X.Close>
            </div>
          </X.Popup>
        </X.Portal>
      </X.Root>,
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

  /** Renders more direct children of the Body, which the Body does not render itself */
  function Filling() {
    const [count, setCount] = useState(1);
    const lines = Array.from({ length: count }, (_, i) => `Line ${i + 1}`);
    return (
      <>
        <button type="button" onClick={() => setCount(80)}>
          Fill
        </button>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </>
    );
  }

  /** A right drawer with `content` in its Body; the Body never re-renders after the open */
  async function open(content: ReactNode) {
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup data-testid="popup">
            <Drawer.Title>Terms</Drawer.Title>
            <Drawer.Body>{content}</Drawer.Body>
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
    expect(body).not.toHaveAttribute("tabindex");
    return body;
  }

  it("becomes a tab stop when a child grows on its own, without a render of the Body", async () => {
    const body = await open(<Growing />);
    const { clientHeight } = body;
    await userEvent.click(screen.getByRole("button", { name: "Grow" }));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("0");
    // The box did not change, so the Body's own size reported nothing
    expect(body.clientHeight).toBe(clientHeight);
  });

  it("becomes a tab stop when a child renders more content into it", async () => {
    const body = await open(<Filling />);
    const { clientHeight } = body;
    await userEvent.click(screen.getByRole("button", { name: "Fill" }));
    await expect.poll(() => body.getAttribute("tabindex")).toBe("0");
    expect(body.clientHeight).toBe(clientHeight);
  });
});
