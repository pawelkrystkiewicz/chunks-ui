import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Combobox } from "../components/combobox";
import { Dialog } from "../components/dialog";
import { Drawer } from "../components/drawer";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Select } from "../components/select";
import { Tooltip } from "../components/tooltip";
import { reloadMotion } from "./use-motion";

// vitest.setup.ts stubs matchMedia; a test swaps in a query that reports reduced motion
const { matchMedia } = window;

afterEach(() => {
  cleanup();
  window.matchMedia = matchMedia;
});

type Row = {
  part: string;
  /** Mounts the part open as `data-testid="popup"`, with a consumer `render` when given one. */
  ui: (renderProp?: ReactElement) => ReactNode;
  /** The style Motion writes inline from the part's `from` values, as [property, value]. Most parts fade. */
  inline?: ["opacity", string] | ["transform", string];
};

// The nine popup parts that pick Motion or CSS through usePopupRender
const parts: Row[] = [
  {
    part: "Dialog.Backdrop",
    ui: (r) => (
      <Dialog.Root open>
        <Dialog.Portal>
          <Dialog.Backdrop render={r} data-testid="popup" />
          <Dialog.Popup>Content</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ),
  },
  {
    part: "Dialog.Popup",
    ui: (r) => (
      <Dialog.Root open>
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
    ui: (r) => (
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Backdrop render={r} data-testid="popup" />
          <Drawer.Popup>Content</Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
  },
  {
    part: "Drawer.Popup",
    ui: (r) => (
      <Drawer.Root open>
        <Drawer.Portal>
          <Drawer.Popup side="bottom" render={r} data-testid="popup">
            Content
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    ),
    // The drawer slides, so Motion writes a transform and the CSS path a translate
    inline: ["transform", "translateY(100%)"],
  },
  {
    part: "Popover.Content",
    ui: (r) => (
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content render={r} data-testid="popup">
          Content
        </Popover.Content>
      </Popover.Root>
    ),
  },
  {
    part: "Menu.Content",
    ui: (r) => (
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content render={r} data-testid="popup">
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    ),
  },
  {
    part: "Tooltip.Popup",
    ui: (r) => (
      <Tooltip.Root open>
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
    ui: (r) => (
      <Select.Root open>
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
    ui: (r) => (
      <Combobox.Root open items={["apple"]}>
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
];

describe.each(parts)("$part with Motion loaded", ({ ui, inline = ["opacity", "0"] }) => {
  const [property, closed] = inline;

  it("animates the default element with Motion, not CSS", async () => {
    await reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).not.toHaveClass("micro-interactions");
    // A motion.div renders its initial values inline: the part's `from`, not its `to`
    expect(el.style[property]).toBe(closed);
  });

  // A consumer's `render` replaces the animated element, so the spring cannot attach to it
  it("keeps the CSS transition on the element a render prop gives it", async () => {
    await reloadMotion();
    render(ui(<section />));
    const el = screen.getByTestId("popup");
    expect(el.tagName).toBe("SECTION");
    expect(el).toHaveClass("micro-interactions");
  });

  // The user's preference is read live and wins over a loaded Motion
  it("keeps the CSS transition for a user who prefers reduced motion", async () => {
    window.matchMedia = () =>
      ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      }) as unknown as MediaQueryList;
    await reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).toHaveClass("micro-interactions");
  });

  // The Motion choice is frozen at mount: a part that opened on CSS keeps its element when Motion arrives
  it("keeps its element when Motion finishes loading after it opened", async () => {
    const loading = reloadMotion();
    render(ui());
    const el = screen.getByTestId("popup");
    expect(el).toHaveClass("micro-interactions");
    await act(() => loading);
    expect(screen.getByTestId("popup")).toBe(el);
  });
});
