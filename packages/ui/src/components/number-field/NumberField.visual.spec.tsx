import { describe, expect, it, onTestFinished } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Dialog } from "../dialog";
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

// Specs run in an iframe, where Chromium refuses pointer lock ("WrongDocumentError") and Base UI
// then removes the cursor. Grant the lock so the cursor stays.
function grantPointerLock() {
  onTestFinished(() => {
    Reflect.deleteProperty(document.body, "requestPointerLock");
  });
  document.body.requestPointerLock = () => Promise.resolve();
}

function startScrub(target: Element) {
  target.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }),
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

  // The cursor portals to <body>, beside the overlay layers, so it must stack above them
  it("keeps the scrub cursor above an open Dialog", async () => {
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
    const layer = (element: Element) => {
      let node = element;
      while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
      return Number(getComputedStyle(node).zIndex);
    };
    expect(layer(cursor)).toBeGreaterThan(layer(getByRole("dialog")));
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
});
