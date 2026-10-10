import { describe, expect, it, onTestFinished } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { NumberField } from "./index";

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
    // Specs run in an iframe, where Chromium refuses pointer lock ("WrongDocumentError") and
    // Base UI then removes the cursor. Grant the lock so the cursor stays.
    onTestFinished(() => {
      Reflect.deleteProperty(document.body, "requestPointerLock");
    });
    document.body.requestPointerLock = () => Promise.resolve();
    const { getByText, findByTestId } = await renderFixture(
      <NumberField.Root defaultValue={42}>
        <NumberField.ScrubArea>
          <span>Amount</span>
          <NumberField.ScrubAreaCursor data-testid="cursor" />
        </NumberField.ScrubArea>
        <NumberField.Group>
          <NumberField.Input aria-label="Amount" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    getByText("Amount").dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }),
    );
    const cursor = await findByTestId("cursor");
    const { width, height } = cursor.getBoundingClientRect();
    expect(getComputedStyle(cursor).display).not.toBe("none");
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
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
