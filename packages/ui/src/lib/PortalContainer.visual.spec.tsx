import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { PortalContainerProvider } from "./portal-container";

// Lives in the browser (visual) suite, not jsdom: real clicks respect a modal's `inert` and the
// stacking order, which jsdom cannot check. No screenshots are taken.
function FruitSelect() {
  return (
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
  );
}

const parents: Record<string, () => ReactNode> = {
  Dialog: () => (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Pick a fruit</Dialog.Title>
          <FruitSelect />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  ),
  Drawer: () => (
    <Drawer.Root defaultOpen>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right">
          <Drawer.Title>Pick a fruit</Drawer.Title>
          <FruitSelect />
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer.Root>
  ),
  Popover: () => (
    <Popover.Root>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Pick a fruit</Popover.Title>
        <FruitSelect />
      </Popover.Content>
    </Popover.Root>
  ),
};

function Harness({ parent, withProvider }: { parent: string; withProvider: boolean }) {
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const content = parents[parent]?.();
  return (
    <>
      {withProvider ? (
        <PortalContainerProvider value={layer}>{content}</PortalContainerProvider>
      ) : (
        content
      )}
      <div ref={setLayer} />
    </>
  );
}

describe("popups nested in a modal", () => {
  it.each([
    ["Dialog", false],
    ["Dialog", true],
    ["Drawer", false],
    ["Drawer", true],
  ])("keeps a Select inside a %s usable (provider: %s)", async (parent, withProvider) => {
    render(<Harness parent={parent} withProvider={withProvider} />);
    const trigger = page.getByRole("combobox", { name: "Fruit" });
    await trigger.click();
    await page.getByRole("option", { name: "Banana" }).click();
    await expect.element(trigger).toHaveTextContent("banana");
  });

  it("renders a Select inside a Popover into the Popover's portal under a provider", async () => {
    render(<Harness parent="Popover" withProvider />);
    await page.getByRole("button", { name: "Open" }).click();
    const trigger = page.getByRole("combobox", { name: "Fruit" });
    await trigger.click();
    // Without the context reset the listbox would land in the provider's layer, outside the Popover
    const portal = page.getByText("Pick a fruit").element().closest("[data-base-ui-portal]");
    expect(portal?.contains(page.getByRole("listbox").element())).toBe(true);
    await page.getByRole("option", { name: "Banana" }).click();
    await expect.element(trigger).toHaveTextContent("banana");
    await expect.element(page.getByText("Pick a fruit")).toBeVisible();
  });
});
