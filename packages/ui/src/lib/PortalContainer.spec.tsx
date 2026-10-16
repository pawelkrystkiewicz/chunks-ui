import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, createRef, type ReactNode, type Ref } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Combobox } from "../components/combobox";
import { DatePicker } from "../components/date-picker";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { NumberField } from "../components/number-field";
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

// Like Dialog, Drawer, Popover and Combobox, these parts provide their own portal node to what
// opens inside them: a nested popup lands there also under a provider, and so does the scrub
// cursor, which has no fallback of its own
describe("a popup's own portal node", () => {
  // jsdom has no Pointer Lock API. Base UI drops the scrub cursor when the lock request fails.
  beforeEach(() => {
    document.body.requestPointerLock = () => Promise.resolve();
    document.exitPointerLock = () => {};
  });
  afterEach(() => {
    Reflect.deleteProperty(document.body, "requestPointerLock");
    Reflect.deleteProperty(document, "exitPointerLock");
  });

  const content = (
    <>
      <Popover.Root open>
        <Popover.Trigger>Nested</Popover.Trigger>
        <Popover.Content data-testid="nested">Nested</Popover.Content>
      </Popover.Root>
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea>
          <span>Amount</span>
          <NumberField.ScrubAreaCursor data-testid="cursor" />
        </NumberField.ScrubArea>
      </NumberField.Root>
    </>
  );

  const parents: Case[] = [
    {
      name: "Menu",
      ui: (
        <Menu.Root open>
          <Menu.Trigger>Open</Menu.Trigger>
          <Menu.Content data-testid="popup">{content}</Menu.Content>
        </Menu.Root>
      ),
    },
    {
      name: "Select",
      ui: (
        <Select.Root open>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup data-testid="popup">{content}</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ),
    },
    {
      name: "Tooltip",
      ui: (
        <Tooltip.Root open>
          <Tooltip.Trigger>Hover</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">{content}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ),
    },
  ];

  it.each(parents)("$name: holds the popups and the scrub cursor opened inside it", async (c) => {
    const container = makeContainer();
    render(<PortalContainerProvider value={container}>{c.ui}</PortalContainerProvider>);
    const portalNode = (await screen.findByTestId("popup")).closest("[data-base-ui-portal]");
    // The part's own node, which still renders in the provider's element
    expect(portalNode?.parentElement).toBe(container);
    expect(portalNode).toContainElement(await screen.findByTestId("nested"));

    fireEvent.pointerDown(screen.getByText("Amount"), { pointerType: "mouse", button: 0 });
    expect((await screen.findByTestId("cursor")).parentElement).toBe(portalNode);
  });
});

// Each Portal merges the consumer's `ref` with the one that feeds the node to its
// PortalContainerProvider. Dropping the consumer's side leaves `ref.current` null. (Dropping ours
// is covered by the NumberField overlay table, which needs the provided node.)
describe("a Portal's consumer ref", () => {
  const portals: { name: string; ui: (ref: Ref<HTMLDivElement>) => ReactNode }[] = [
    {
      name: "Dialog.Portal",
      ui: (ref) => (
        <Dialog.Root open>
          <Dialog.Portal ref={ref}>
            <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ),
    },
    {
      name: "Drawer.Portal",
      ui: (ref) => (
        <Drawer.Root open>
          <Drawer.Portal ref={ref}>
            <Drawer.Popup data-testid="popup">Content</Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      ),
    },
    {
      name: "Combobox.Portal",
      ui: (ref) => (
        <Combobox.Root open items={["a"]}>
          <Combobox.Input />
          <Combobox.Portal ref={ref}>
            <Combobox.Positioner>
              <Combobox.Popup data-testid="popup">Content</Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      ),
    },
    {
      name: "Select.Portal",
      ui: (ref) => (
        <Select.Root open>
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Portal ref={ref}>
            <Select.Positioner>
              <Select.Popup data-testid="popup">Content</Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ),
    },
    {
      name: "Tooltip.Portal",
      ui: (ref) => (
        <Tooltip.Root open>
          <Tooltip.Trigger>Hover</Tooltip.Trigger>
          <Tooltip.Portal ref={ref}>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ),
    },
  ];

  it.each(portals)("$name: receives the portal node, which holds the popup", async ({ ui }) => {
    const ref = createRef<HTMLDivElement>();
    render(ui(ref));
    const popup = await screen.findByTestId("popup");
    expect(ref.current).toHaveAttribute("data-base-ui-portal");
    expect(ref.current).toContainElement(popup);
  });
});

// `usePortalNode` keeps the node when React detaches the ref. A hidden <Activity> detaches refs
// without unmounting, so clearing the node there would hand nested popups `container={null}`
// while hidden and remount them on reveal.
describe("usePortalNode under <Activity>", () => {
  it("does not remount a popup nested in an open Dialog when the Activity is hidden and revealed", async () => {
    const tree = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <Dialog.Root open>
          <Dialog.Portal>
            <Dialog.Popup>
              <Popover.Root open>
                <Popover.Trigger>Open</Popover.Trigger>
                <Popover.Content>
                  <span data-testid="counted" />
                </Popover.Content>
              </Popover.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Activity>
    );
    const { rerender } = render(tree("visible"));
    const before = await screen.findByTestId("counted");

    rerender(tree("hidden"));
    rerender(tree("visible"));
    // A remount creates a new DOM node
    expect(await screen.findByTestId("counted")).toBe(before);
  });
});
