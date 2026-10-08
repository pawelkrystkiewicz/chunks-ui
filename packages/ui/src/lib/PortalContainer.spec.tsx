import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Combobox } from "../components/combobox";
import { DatePicker } from "../components/date-picker";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { Tooltip } from "../components/tooltip";
import { PortalContainerProvider } from "./portal-container";

const containers: HTMLElement[] = [];
const makeContainer = () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  containers.push(el);
  return el;
};

afterEach(() => {
  cleanup();
  for (const el of containers.splice(0)) el.remove();
});

type Case = { name: string; ui: ReactNode };

const cases: Case[] = [
  {
    name: "Popover",
    ui: (
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="popup">Content</Popover.Content>
      </Popover.Root>
    ),
  },
  {
    name: "Select",
    ui: (
      <Select.Root open defaultValue="a">
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.Item value="a">A</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
  },
  {
    name: "Menu",
    ui: (
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content data-testid="popup">
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    ),
  },
  {
    name: "Combobox",
    ui: (
      <Combobox.Root open items={["a"]}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.List>
                {(item: string) => <Combobox.Item key={item} value={item} />}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
  {
    name: "Dialog",
    ui: (
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    name: "Drawer",
    ui: (
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup data-testid="popup">Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    name: "Tooltip",
    ui: (
      <Tooltip.Root open>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="popup">Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
];

describe("PortalContainerProvider", () => {
  it.each(cases)("renders $name into the provided container", async (c) => {
    const container = makeContainer();
    render(<PortalContainerProvider value={container}>{c.ui}</PortalContainerProvider>);
    expect(container).toContainElement(await screen.findByTestId("popup"));
  });

  it("renders DatePicker into the provided container", async () => {
    const container = makeContainer();
    render(
      <PortalContainerProvider value={container}>
        <DatePicker placeholder="Pick" />
      </PortalContainerProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pick" }));
    expect(container).toContainElement(await screen.findByRole("dialog"));
  });

  it("renders into document.body without a provider", async () => {
    const { container } = render(cases[0]?.ui);
    const popup = await screen.findByTestId("popup");
    expect(container).not.toContainElement(popup);
    expect(document.body).toContainElement(popup);
  });

  it("holds popups back while the container is null, then renders inside it", async () => {
    const container = makeContainer();
    const popover = (
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="popup">Content</Popover.Content>
      </Popover.Root>
    );
    const { rerender } = render(
      <PortalContainerProvider value={null}>{popover}</PortalContainerProvider>,
    );
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();

    rerender(<PortalContainerProvider value={container}>{popover}</PortalContainerProvider>);
    expect(container).toContainElement(await screen.findByTestId("popup"));
  });
});
