import { describe, it } from "vitest";
import { renderPage } from "../../VisualTest.utils";
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
});
