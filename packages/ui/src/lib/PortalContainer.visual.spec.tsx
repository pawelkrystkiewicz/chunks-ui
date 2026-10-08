import { render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Dialog } from "../components/dialog";
import { Select } from "../components/select";
import { PortalContainerProvider } from "./portal-container";

// ponytail: lives in the browser (visual) suite for real clicks, which respect a modal's `inert`; no screenshot
function NestedHarness() {
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  return (
    <>
      <PortalContainerProvider value={layer}>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Backdrop />
            <Dialog.Popup>
              <Dialog.Title>Pick a fruit</Dialog.Title>
              <Select.Root defaultValue="apple">
                <Select.Trigger aria-label="Fruit">
                  <Select.Value />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner>
                    <Select.Popup>
                      <Select.Item value="apple">
                        <Select.ItemText>Apple</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="banana">
                        <Select.ItemText>Banana</Select.ItemText>
                      </Select.Item>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </PortalContainerProvider>
      <div ref={setLayer} />
    </>
  );
}

describe("PortalContainerProvider", () => {
  it("keeps a Select inside a modal Dialog usable", async () => {
    render(<NestedHarness />);
    const trigger = page.getByRole("combobox", { name: "Fruit" });
    await trigger.click();
    await page.getByRole("option", { name: "Banana" }).click();
    await expect.element(trigger).toHaveTextContent("banana");
  });
});
