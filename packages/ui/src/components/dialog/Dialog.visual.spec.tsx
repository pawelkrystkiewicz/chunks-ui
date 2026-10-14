import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { renderPage, ringColor, systemColour, withViewport } from "../../VisualTest.utils";
import { Button } from "../button";
import { Dialog } from "./index";

const SECTIONS = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);

describe("Dialog", () => {
  it("open", async () => {
    const body = await renderPage(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Dialog Title</Dialog.Title>
            <Dialog.Description>This is a dialog description.</Dialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
                Cancel
              </Dialog.Close>
              <Dialog.Close render={<Button />}>Confirm</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("open with long content in a Body", async () => {
    const body = await renderPage(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Terms of service</Dialog.Title>
            <Dialog.Description>Read the terms before you accept them.</Dialog.Description>
            <Dialog.Body className="mt-4 space-y-3 text-sm">
              {SECTIONS.map((section) => (
                <p key={section}>
                  {section}. These terms apply to your use of the service. Keep your account details
                  safe and tell us when something looks wrong.
                </p>
              ))}
            </Dialog.Body>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close render={<Button variant="outlined" color="secondary" />}>
                Cancel
              </Dialog.Close>
              <Dialog.Close render={<Button />}>Accept</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("open with nothing tabbable, focused from the keyboard", async () => {
    await focusedPopup();
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });
});

/** Nothing tabbable inside, so Base UI focuses the popup itself */
const untabbable = (
  <Dialog.Root defaultOpen>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Popup data-testid="popup">
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Description>This is a dialog description.</Dialog.Description>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);

/** Renders `untabbable` after a key press, so the popup shows the focus ring */
async function focusedPopup() {
  await userEvent.keyboard("{Shift}");
  render(untabbable);
  const popup = await screen.findByTestId("popup");
  await expect.poll(() => popup.matches(":focus-visible")).toBe(true);
  return popup;
}

describe("Dialog.Popup focused from the keyboard", () => {
  it("draws the library ring around the popup", async () => {
    const { outlineStyle, outlineWidth, outlineColor, outlineOffset } = getComputedStyle(
      await focusedPopup(),
    );
    expect({ outlineStyle, outlineWidth, outlineColor, outlineOffset }).toEqual({
      outlineStyle: "solid",
      outlineWidth: "2px",
      outlineColor: ringColor(),
      outlineOffset: "2px",
    });
  });
});

describe("Dialog.Popup on a narrow page", () => {
  // Narrower than the popup's 28rem cap: the popup takes the page less a 1rem gutter on each side
  withViewport(360);

  it("keeps a gutter on each side, so the whole ring shows", async () => {
    const popup = await focusedPopup();
    const { left, right } = popup.getBoundingClientRect();
    // The ring takes 4px outside the edge: 2px of offset, then 2px of outline
    expect(left).toBeCloseTo(16, 0);
    expect(innerWidth - right).toBeCloseTo(16, 0);
    await expect(page.elementLocator(document.body)).toMatchScreenshot();
  });
});

describe("Dialog.Popup in forced colours", () => {
  afterEach(() => commands.emulateMedia({ forcedColors: "none" }));

  // Forced colours revert the `--ring` colour to the browser's focus colour
  it("draws the ring in the system focus colour", async () => {
    await commands.emulateMedia({ forcedColors: "active" });
    await expect.poll(() => matchMedia("(forced-colors: active)").matches).toBe(true);
    expect(getComputedStyle(await focusedPopup()).outlineColor).toBe(systemColour("Highlight"));
  });
});
