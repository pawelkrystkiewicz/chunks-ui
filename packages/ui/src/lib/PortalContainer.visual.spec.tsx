import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Combobox } from "../components/combobox";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { Tooltip } from "../components/tooltip";
import { AppBars, expectAboveAppBars, inside, overlays } from "../VisualTest.overlays";
import { waitForStable } from "../VisualTest.utils";
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
};

function Harness({ children, withProvider }: { children: ReactNode; withProvider: boolean }) {
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  return (
    <>
      {withProvider ? (
        <PortalContainerProvider value={layer}>{children}</PortalContainerProvider>
      ) : (
        children
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
    render(<Harness withProvider={withProvider}>{parents[parent]?.()}</Harness>);
    const trigger = page.getByRole("combobox", { name: "Fruit" });
    await trigger.click();
    await page.getByRole("option", { name: "Banana" }).click();
    await expect.element(trigger).toHaveTextContent("banana");
  });

  it("keeps a Tooltip above the modal Dialog it opens from", async () => {
    render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Help</Dialog.Title>
            <Tooltip.Root defaultOpen>
              <Tooltip.Trigger>Hover me</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>Tooltip text</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await expect.element(page.getByText("Tooltip text")).toBeVisible();
    const popup = page.getByText("Tooltip text").element();
    const dialog = page.getByRole("dialog").element();
    const centre = () => {
      const box = popup.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    };
    // The tooltip must sit over the dialog (and be positioned), or the stacking check proves nothing
    await expect
      .poll(() => {
        const { x, y } = centre();
        const dialogBox = dialog.getBoundingClientRect();
        return (
          x > dialogBox.left && x < dialogBox.right && y > dialogBox.top && y < dialogBox.bottom
        );
      })
      .toBe(true);
    const { x, y } = centre();
    expect(popup.contains(document.elementFromPoint(x, y))).toBe(true);
  });
});

describe("overlays opened from an overlay", () => {
  it.each([
    ["Dialog", "Dialog"],
    ["Drawer", "Dialog"],
    ["Dialog", "Drawer"],
    ["Drawer", "Drawer"],
  ] as const)("puts a %s opened from a %s on top and dims it", async (child, parent) => {
    const Parent = overlays[parent];
    const Child = overlays[child];
    render(
      <Parent name="Parent" defaultOpen>
        <Child name="Child" side="left" />
      </Parent>,
    );
    const parentPopup = page.getByRole("dialog", { name: "Parent" }).element();
    await page.getByRole("button", { name: "Open Child" }).click();
    const childLocator = page.getByRole("dialog", { name: "Child" });
    await expect.element(childLocator).toBeVisible();
    const childPopup = childLocator.element();
    const parentBox = parentPopup.getBoundingClientRect();
    const childCentre = (): [number, number] => {
      const box = childPopup.getBoundingClientRect();
      return [box.left + box.width / 2, box.top + box.height / 2];
    };

    // The child must have slid in over the parent, or the stacking check proves nothing
    await expect.poll(() => inside(parentBox, childCentre())).toBe(true);
    expect(childPopup.contains(document.elementFromPoint(...childCentre()))).toBe(true);

    // Where the parent still shows, a layer that dims it sits on top
    const childBox = childPopup.getBoundingClientRect();
    const parentOnly = (
      [
        [parentBox.left + 4, parentBox.top + 4],
        [parentBox.right - 4, parentBox.top + 4],
        [parentBox.left + 4, parentBox.bottom - 4],
        [parentBox.right - 4, parentBox.bottom - 4],
      ] as [number, number][]
    ).find((point) => !inside(childBox, point));
    expect(parentOnly).toBeDefined();
    const cover = parentOnly && document.elementFromPoint(...parentOnly);
    expect(cover && parentPopup.contains(cover)).toBe(false);
    expect(cover && getComputedStyle(cover).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

    // The child is interactive; closing it leaves the parent open
    await page.getByRole("button", { name: "Close Child" }).click();
    await expect.element(childLocator).not.toBeInTheDocument();
    await expect.element(page.getByRole("dialog", { name: "Parent" })).toBeVisible();
  });

  it.each([false, true])(
    "keeps a Select usable inside a Drawer opened from a Dialog (provider: %s)",
    async (withProvider) => {
      render(
        <Harness withProvider={withProvider}>
          <overlays.Dialog name="Parent" defaultOpen>
            <overlays.Drawer name="Child" side="right">
              <FruitSelect />
            </overlays.Drawer>
          </overlays.Dialog>
        </Harness>,
      );
      await page.getByRole("button", { name: "Open Child" }).click();
      const drawer = page.getByRole("dialog", { name: "Child" });
      await expect.element(drawer).toBeVisible();
      const trigger = page.getByRole("combobox", { name: "Fruit" });
      await trigger.click();
      const option = page.getByRole("option", { name: "Banana" });
      await expect.element(option).toBeVisible();
      const optionCentre = (): [number, number] => {
        const box = option.element().getBoundingClientRect();
        return [box.left + box.width / 2, box.top + box.height / 2];
      };

      // The option must lie over the drawer, or the stacking check proves nothing
      await expect
        .poll(() => inside(drawer.element().getBoundingClientRect(), optionCentre()))
        .toBe(true);
      expect(option.element().contains(document.elementFromPoint(...optionCentre()))).toBe(true);

      await option.click();
      await expect.element(trigger).toHaveTextContent("banana");
    },
  );
});

describe("overlays opened from the page", () => {
  it.each(["Dialog", "Drawer"] as const)(
    "puts a %s above fixed and sticky app bars",
    async (name) => {
      const Overlay = overlays[name];
      render(
        <>
          <Overlay name={name} />
          <AppBars />
        </>,
      );
      await page.getByRole("button", { name: `Open ${name}` }).click();
      const popupLocator = page.getByRole("dialog", { name });
      await expect.element(popupLocator).toBeVisible();
      const popup = popupLocator.element();
      const backdrop = page.getByTestId(`${name} backdrop`).element();
      await waitForStable(() => popup.getBoundingClientRect());
      expectAboveAppBars(name, popup, backdrop);
    },
  );
});

// keepMounted puts the tooltip's portal in the DOM before the parent opens. A modal parent
// aria-hides every mounted node outside its own portal when it opens.
function InfoTooltip() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>Info</Tooltip.Trigger>
      <Tooltip.Portal keepMounted>
        <Tooltip.Positioner>
          <Tooltip.Popup>Tooltip text</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

const modalPopups = {
  Popover: {
    ui: (
      <Popover.Root modal>
        <Popover.Trigger>Settings</Popover.Trigger>
        <Popover.Content>
          <InfoTooltip />
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover.Root>
    ),
    open: () => page.getByRole("button", { name: "Settings" }).click(),
  },
  Combobox: {
    ui: (
      <Combobox.Root items={["apple"]}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <InfoTooltip />
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
    open: async () => {
      await page.getByRole("combobox", { name: "Fruit" }).click();
      await userEvent.keyboard("a");
    },
  },
};

describe("popups nested in a modal popup", () => {
  it.each([
    ["Popover", false],
    ["Popover", true],
    ["Combobox", false],
    ["Combobox", true],
  ] as const)(
    "keeps a Tooltip inside a %s visible to assistive tech (provider: %s)",
    async (parent, withProvider) => {
      render(<Harness withProvider={withProvider}>{modalPopups[parent].ui}</Harness>);
      await modalPopups[parent].open();
      await page.getByRole("button", { name: "Info" }).hover();
      const tooltip = page.getByText("Tooltip text");
      await expect.element(tooltip).toBeVisible();
      expect(tooltip.element().closest('[aria-hidden="true"]')).toBeNull();
    },
  );
});
