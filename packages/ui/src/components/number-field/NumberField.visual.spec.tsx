import { render } from "@testing-library/react";
import { describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { inside } from "../../VisualTest.overlays";
import {
  expectNotAllowed,
  focusVisible,
  renderFixture,
  waitForStable,
} from "../../VisualTest.utils";
import { Dialog } from "../dialog";
import { Toast } from "../toast";
import { NumberField } from "./index";

function ScrubField() {
  return (
    <NumberField.Root defaultValue={42}>
      <NumberField.ScrubArea>
        <span>Amount</span>
        <NumberField.ScrubAreaCursor data-testid="cursor" />
      </NumberField.ScrubArea>
      <NumberField.Group>
        <NumberField.Input aria-label="Amount" />
      </NumberField.Group>
    </NumberField.Root>
  );
}

const disabledField = () => (
  <NumberField.Root defaultValue={42} disabled>
    <NumberField.Group>
      <NumberField.Decrement />
      <NumberField.Input aria-label="Amount" />
      <NumberField.Increment />
    </NumberField.Group>
  </NumberField.Root>
);

// Specs run in an iframe, where Chromium refuses pointer lock ("WrongDocumentError") and Base UI
// then removes the cursor. Grant the lock so the cursor stays.
function grantPointerLock() {
  onTestFinished(() => {
    Reflect.deleteProperty(document.body, "requestPointerLock");
  });
  document.body.requestPointerLock = () => Promise.resolve();
}

// Base UI centres the cursor on the pointerdown's client point
function startScrub(target: Element, point: { clientX?: number; clientY?: number } = {}) {
  target.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse", ...point }),
  );
}

describe("NumberField", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <NumberField.Root defaultValue={42} max={100} min={0}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Base UI hides the system cursor with pointer lock while scrubbing and shows this part instead
  it("shows the scrub cursor while scrubbing", async () => {
    grantPointerLock();
    const { getByText, findByTestId } = await renderFixture(<ScrubField />);
    startScrub(getByText("Amount"));
    const cursor = await findByTestId("cursor");
    const { width, height } = cursor.getBoundingClientRect();
    expect(getComputedStyle(cursor).display).not.toBe("none");
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    window.dispatchEvent(new PointerEvent("pointerup"));
  });

  // The cursor portals into the dialog's own portal node (#438), so it stacks in the dialog's layer
  // and above the popup inside it, not above the overlay layers from <body>
  it("keeps the scrub cursor in the dialog's portal, above the popup", async () => {
    grantPointerLock();
    const { getByText, findByTestId, getByRole } = await renderFixture(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Edit amount</Dialog.Title>
            <ScrubField />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    startScrub(getByText("Amount"));
    const cursor = await findByTestId("cursor");
    const popup = getByRole("dialog");
    expect(cursor.closest("[data-base-ui-portal]")).toContainElement(popup);
    const z = (element: Element) => Number(getComputedStyle(element).zIndex) || 0;
    expect(z(cursor)).toBeGreaterThan(z(popup));
    window.dispatchEvent(new PointerEvent("pointerup"));
  });

  // The trade-off #440 accepted: in the dialog's portal the cursor stacks in the dialog's layer
  // (z-modals), not at z-cursor, so a Toast at the root (z-toasts) paints over it
  it("lets a root Toast paint over the scrub cursor in a Dialog", async () => {
    grantPointerLock();
    const manager = Toast.createToastManager();
    const { getByText, findByText, findByTestId } = render(
      <Toast.Provider toastManager={manager}>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>Edit amount</Dialog.Title>
              <ScrubField />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    manager.add({ title: "Saved", timeout: 0 });
    const toast = (await findByText("Saved")).closest(".Toast") as HTMLElement;
    const box = await waitForStable(() => toast.getBoundingClientRect());
    const point: [number, number] = [box.left + box.width / 2, box.top + box.height / 2];
    startScrub(getByText("Amount"), { clientX: point[0], clientY: point[1] });
    const cursor = await findByTestId("cursor");

    // The cursor covers the toast's centre, or the check proves nothing
    await expect.poll(() => inside(cursor.getBoundingClientRect(), point)).toBe(true);
    // Base UI makes the cursor click-through; hit-test it like the toast
    cursor.style.pointerEvents = "auto";
    expect(toast.contains(document.elementFromPoint(...point))).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerup"));
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <NumberField.Root defaultValue={42} disabled max={100} min={0}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus on the input shows the ring on the Group around it: 2px of --ring, 2px outside
  // the border, as on Input. The input itself draws none.
  it("focused input, ring on the Group", async () => {
    const { fixture, getByRole } = await renderFixture(
      <NumberField.Root defaultValue={42} max={100} min={0}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>,
    );
    const input = getByRole("textbox");
    focusVisible(input);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on every part of a disabled field", () => {
    const { getByRole } = render(disabledField());
    expectNotAllowed(
      getByRole("group"),
      getByRole("textbox", { name: "Amount" }),
      getByRole("button", { name: "Increase" }),
      getByRole("button", { name: "Decrease" }),
    );
  });

  it("keeps a disabled increment button at its rest colour under the pointer", async () => {
    const { getByRole } = render(disabledField());
    const increment = getByRole("button", { name: "Increase" });
    const rest = getComputedStyle(increment).color;
    await userEvent.hover(increment);
    expect(getComputedStyle(increment).color).toBe(rest);
  });
});
