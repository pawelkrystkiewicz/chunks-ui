import type { ReactElement, ReactNode } from "react";
import { Combobox } from "../components/combobox";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { Tooltip } from "../components/tooltip";

// The popup parts that pick Motion or CSS through usePopupRender, for UsePopupRender.spec.tsx
// (jsdom) and PopupRender.visual.spec.tsx (browser). UsePopupRender.parts.spec.ts checks the rows
// against the call sites.
export const popupParts = table([
  {
    part: "Dialog.Backdrop",
    ui: (r, open = true) => (
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Backdrop render={r} data-testid="popup" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    part: "Dialog.Popup",
    ui: (r, open = true) => (
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Popup render={r} data-testid="popup">
            Content
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    part: "Drawer.Backdrop",
    ui: (r, open = true) => (
      <Drawer.Root open={open}>
        <Drawer.Portal>
          <Drawer.Backdrop render={r} data-testid="popup" />
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    // One side: `cssSlide` in core's Drawer.Variants.ts is on the base, shared by the three sides
    part: "Drawer.Popup",
    ui: (r, open = true) => (
      <Drawer.Root open={open}>
        <Drawer.Portal>
          <Drawer.Popup side="bottom" render={r} data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    part: "Popover.Content",
    ui: (r, open = true) => (
      <Popover.Root open={open}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content render={r} data-testid="popup">
          Content
        </Popover.Content>
      </Popover.Root>
    ),
  },
  {
    part: "Menu.Content",
    ui: (r, open = true) => (
      <Menu.Root open={open}>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content render={r} data-testid="popup">
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    ),
  },
  {
    part: "Tooltip.Popup",
    ui: (r, open = true) => (
      <Tooltip.Root open={open}>
        <Tooltip.Trigger>Hover</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup render={r} data-testid="popup">
              Tip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ),
  },
  {
    part: "Select.Popup",
    ui: (r, open = true) => (
      <Select.Root open={open}>
        <Select.Trigger>Pick</Select.Trigger>
        {/* Below its trigger: aligned over it, the popup fades without a scale */}
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup render={r} data-testid="popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>
    ),
  },
  {
    part: "Combobox.Popup",
    ui: (r, open = true) => (
      <Combobox.Root open={open} items={["apple"]}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup render={r} data-testid="popup">
              <Combobox.List>{(item) => <Combobox.Item key={item} value={item} />}</Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    ),
  },
]);

/** The rows as given, with each `part` kept as a literal so a spec can key its own data by part */
function table<Part extends string>(
  rows: {
    part: Part;
    /**
     * Mounts the part as `data-testid="popup"`, open unless `open` is false, with a consumer
     * `render` when given one.
     */
    ui: (renderProp?: ReactElement, open?: boolean) => ReactNode;
  }[],
) {
  return rows;
}

export type PopupPartName = (typeof popupParts)[number]["part"];
