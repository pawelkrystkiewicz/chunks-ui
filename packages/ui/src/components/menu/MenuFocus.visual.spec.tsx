import { Menu as BaseMenu } from "@base-ui/react/menu";
import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  describeMotionPaths,
  emulateReducedMotion,
  enterMotionPath,
  SETTLE_TIMEOUT_MS,
  settled,
  waitForStable,
} from "../../VisualTest.utils";
import { Dialog } from "../dialog";
import { Menu } from "./index";

/*
 * W151 (#383). Base UI's `useListNavigation` focuses the popup when the pointer leaves an item
 * for anything but another item (its `onPointerLeave`): the popup's padding, a separator, or
 * the page. Chromium keeps keyboard modality until a mouse press, so after a keyboard open that
 * focus matches `:focus-visible`, and the popup drew its ring under the mouse. The popup now
 * turns its ring off from the first pointer move over it until the next key press.
 */

/** The popup's ring: on its outline, or on its `::after` overlay when it holds an arrow */
function ringOf(popup: Element) {
  const own = getComputedStyle(popup).outlineStyle !== "none";
  const after = getComputedStyle(popup, "::after");
  return own || (after.content !== "none" && after.display !== "none");
}

/** Renders a menu, opens it from the keyboard (the first item takes focus) and hovers that item */
async function openedFromTheKeyboardThenHovered(arrow: boolean) {
  render(
    <div style={{ padding: 40 }}>
      <button type="button">Before</button>
      <Menu.Root>
        <Menu.Trigger>Options</Menu.Trigger>
        <Menu.Content>
          {arrow && <Menu.Arrow />}
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Copy</Menu.Item>
          <Menu.Separator data-testid="separator" />
          <Menu.Item>Delete</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </div>,
  );
  await userEvent.tab();
  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Options" }));
  await userEvent.keyboard("{ArrowDown}");
  const popup = await screen.findByRole("menu");
  await waitForStable(() => JSON.stringify(popup.getBoundingClientRect()));
  const edit = screen.getByRole("menuitem", { name: "Edit" });
  expect(document.activeElement).toBe(edit);
  await userEvent.hover(edit);
  expect(document.activeElement).toBe(edit);
  return popup;
}

describe("Menu popup focused as the pointer leaves an item", () => {
  /** Hovers Edit, moves to `target`, and checks the popup took focus without drawing its ring */
  async function expectNoRing(popup: Element, to: string, hover: () => Promise<void>) {
    await userEvent.hover(screen.getByRole("menuitem", { name: "Edit" }));
    await hover();
    // Base UI moves the focus to the popup, and Chromium keeps the keyboard modality
    expect(document.activeElement, to).toBe(popup);
    expect(popup.matches(":focus-visible"), to).toBe(true);
    expect(ringOf(popup), to).toBe(false);
  }

  // Inside the 1px border, in the 4px of padding before the items
  const hoverPadding = (popup: Element) => () =>
    userEvent.hover(popup, { position: { x: 3, y: popup.getBoundingClientRect().height / 2 } });

  it("draws no ring on the popup's padding, a separator, or outside the menu", async () => {
    const popup = await openedFromTheKeyboardThenHovered(false);
    await expectNoRing(popup, "padding", hoverPadding(popup));
    await expectNoRing(popup, "separator", () => userEvent.hover(screen.getByTestId("separator")));
    // The page's corner: Base UI's backdrop takes the pointer there, not the "Before" button
    await expectNoRing(popup, "outside", () =>
      userEvent.hover(document.body, { position: { x: 5, y: 5 } }),
    );
  });

  // With an arrow the ring is the popup's `::after` overlay
  it("draws no ring on the padding of a popup with an arrow", async () => {
    const popup = await openedFromTheKeyboardThenHovered(true);
    await expectNoRing(popup, "padding", hoverPadding(popup));
  });

  it.each([false, true])(
    "draws the ring again on the next key press, with arrow %s",
    async (arrow) => {
      const popup = await openedFromTheKeyboardThenHovered(arrow);
      await userEvent.hover(screen.getByTestId("separator"));
      expect(document.activeElement).toBe(popup);
      expect(ringOf(popup)).toBe(false);
      // Moves no focus; the ring is read in the same task as the key
      await userEvent.keyboard("{Shift}");
      expect(document.activeElement).toBe(popup);
      expect(ringOf(popup)).toBe(true);
    },
  );
});

// The handlers reach the popup through `createPopupRenderer`'s `motion.div` when Motion springs it
describeMotionPaths("Menu popup pointer flag", () => {
  it("is set by a real pointer move and hides the ring", async () => {
    const popup = await openedFromTheKeyboardThenHovered(false);
    const { height } = popup.getBoundingClientRect();
    await userEvent.hover(popup, { position: { x: 3, y: height / 2 } });
    expect(document.activeElement).toBe(popup);
    expect(popup.matches(":focus-visible")).toBe(true);
    expect(popup).toHaveAttribute("data-pointer");
    expect(ringOf(popup)).toBe(false);
  });
});

// Base UI returns focus to the trigger only at the unmount, after the exit: a Tab during it went
// to a focus guard in the closing popup, then <body> (#633). The exit is about 0.5s with Motion,
// 0.3s on the CSS path, and a frame with reduced motion.
describe.each([
  { path: "Motion", withMotion: true, reduce: false },
  { path: "CSS fallback", withMotion: false, reduce: false },
  { path: "reduced motion", withMotion: true, reduce: true },
])("Menu focus as the popup closes, $path", ({ withMotion, reduce }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(reduce));
  afterAll(async () => {
    await emulateReducedMotion(true);
    await enterMotionPath(true);
  });

  // A Tab after the exit passes without the fix; skipped for reduced motion's one frame
  const recordTab = (popup: HTMLElement) => {
    let mounted: boolean | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") mounted = popup.isConnected;
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (!reduce) expect(mounted, "the popup was still closing when Tab went down").toBe(true);
    };
  };

  // Enter and Tab go in one call: with reduced motion the popup leaves a frame after the pick
  it("moves a Tab pressed during the exit past the trigger, after a pick by Enter", async () => {
    const { popup, after } = await openMenu();
    await userEvent.keyboard("{ArrowDown}");
    const checkTab = recordTab(popup);
    await userEvent.keyboard("{Enter}{Tab}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await unmounted(popup);
    expect(document.activeElement).toBe(after);
  });

  // Key rollover: the item clicks on Enter's keydown, and Tab goes down before Enter comes up
  it("moves a Tab pressed during the exit past the trigger, with Enter held over it", async () => {
    const { popup, after } = await openMenu();
    await userEvent.keyboard("{ArrowDown}");
    const checkTab = recordTab(popup);
    await userEvent.keyboard("{Enter>}{Tab}{/Enter}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await unmounted(popup);
    expect(document.activeElement).toBe(after);
  });

  // A click and a key press are two calls, too far apart for the one frame of reduced motion
  it.skipIf(reduce)(
    "moves a Tab pressed during the exit past the trigger, after a pick by click",
    async () => {
      const { popup, after } = await openMenu();
      const checkTab = recordTab(popup);
      await userEvent.click(page.getByRole("menuitem", { name: "Copy" }));
      await userEvent.keyboard("{Tab}");
      checkTab();
      expect(document.activeElement).toBe(after);
      await unmounted(popup);
      expect(document.activeElement).toBe(after);
    },
  );

  // Picked in a submenu, the whole menu closes: focus goes to the root trigger
  it("moves a Tab pressed during the exit past the trigger, after a pick in a submenu", async () => {
    const { popup, after } = await openMenu();
    await userEvent.keyboard("{ArrowUp}{ArrowRight}");
    const submenu = await screen.findByTestId("submenu");
    await expect
      .poll(() => submenu.contains(document.activeElement), { timeout: SETTLE_TIMEOUT_MS })
      .toBe(true);
    await settled(submenu);
    const checkTab = recordTab(popup);
    await userEvent.keyboard("{Enter}{Tab}");
    checkTab();
    expect(document.activeElement).toBe(after);
    await unmounted(popup);
    expect(document.activeElement).toBe(after);
  });

  // Motion and CSS only: reduced motion's one-frame exit adds nothing here
  it.skipIf(reduce)("moves focus to the trigger on Escape", async () => {
    const { popup, trigger } = await openMenu();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await unmounted(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // Focus must not come back to the trigger, nor pass through it on the way. Not modal, so the
  // click reaches the field, not Base UI's backdrop.
  it("leaves focus where an outside click put it", async () => {
    const { popup, trigger, before } = await openMenu({ modal: false });
    const triggerFocused = tookFocus(trigger);
    await userEvent.click(before);
    expect(triggerFocused(), "the trigger took focus on the way").toBe(false);
    expect(document.activeElement).toBe(before);
    await unmounted(popup);
    expect(document.activeElement).toBe(before);
  });
});

// Closes that keep Base UI's own focus handling
describe("Menu focus as the popup closes, Base UI's own handling", () => {
  beforeAll(() => enterMotionPath(true));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  // Base UI focuses the submenu's trigger; the arrow keys go on in the menu
  it("leaves focus on the submenu trigger as a submenu closes alone", async () => {
    const { popup, trigger } = await openMenu();
    const triggerFocused = tookFocus(trigger);
    await userEvent.keyboard("{ArrowUp}{ArrowRight}");
    const submenu = await screen.findByTestId("submenu");
    await settled(submenu);
    await userEvent.keyboard("{ArrowLeft}");
    const share = screen.getByRole("menuitem", { name: "Share" });
    expect(document.activeElement).toBe(share);
    await unmounted(submenu);
    expect(document.activeElement).toBe(share);
    expect(popup).toHaveAttribute("data-open");
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Copy" }));
    expect(triggerFocused(), "the trigger took focus").toBe(false);
  });

  // A Tab closes the menu and goes to the field after the trigger
  it("leaves a Tab out of the menu where it went", async () => {
    const { popup, trigger, after } = await openMenu();
    await userEvent.keyboard("{ArrowDown}");
    const triggerFocused = tookFocus(trigger);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
    await unmounted(popup);
    expect(triggerFocused(), "the trigger took focus").toBe(false);
    expect(document.activeElement).toBe(after);
  });

  // The trigger has focus for a frame, until the Dialog takes it (accepted); the Dialog then
  // gives it back to the trigger
  it("lets a Dialog opened by a pick take focus, and return it to the trigger", async () => {
    function MenuWithDialog() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Menu.Root>
            <Menu.Trigger>Options</Menu.Trigger>
            <Menu.Content data-testid="popup">
              <Menu.Item onClick={() => setOpen(true)}>Delete</Menu.Item>
            </Menu.Content>
          </Menu.Root>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="dialog">
                <Dialog.Title>Delete the file?</Dialog.Title>
                <Dialog.Close>Cancel</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      );
    }
    const view = render(<MenuWithDialog />);
    const trigger = view.getByRole("button", { name: "Options" });
    await userEvent.click(trigger);
    const popup = await view.findByTestId("popup");
    await settled(popup);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    const dialog = await view.findByTestId("dialog");
    await expect
      .poll(() => dialog.contains(document.activeElement), { timeout: SETTLE_TIMEOUT_MS })
      .toBe(true);
    await unmounted(popup);
    expect(dialog.contains(document.activeElement), "the Dialog keeps focus").toBe(true);
    await settled(dialog);
    await userEvent.keyboard("{Escape}");
    await unmounted(dialog);
    expect(document.activeElement).toBe(trigger);
  });

  // Hovered items take focus; Base UI returns none after a hover close, and nor does the popup
  it("hands no focus to the trigger on a hover close", async () => {
    const view = render(menuFixture({ openOnHover: true }));
    const before = view.getByRole("textbox", { name: "Before" });
    await userEvent.click(before);
    const trigger = view.getByRole("button", { name: "Options" });
    const triggerFocused = tookFocus(trigger);
    await userEvent.hover(trigger);
    const popup = await view.findByTestId("popup");
    await settled(popup);
    await userEvent.hover(view.getByRole("menuitem", { name: "Edit" }));
    await userEvent.hover(before);
    await unmounted(popup);
    expect(triggerFocused(), "the trigger took focus").toBe(false);
  });
});

// Text fields around the trigger, as WebKit's Tab and click skip buttons
function menuFixture({
  modal,
  openOnHover = false,
}: {
  modal?: boolean;
  openOnHover?: boolean;
} = {}) {
  return (
    <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
      <input aria-label="Before" />
      <Menu.Root modal={modal}>
        <Menu.Trigger openOnHover={openOnHover} delay={0} closeDelay={0}>
          Options
        </Menu.Trigger>
        <Menu.Content data-testid="popup">
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Copy</Menu.Item>
          <BaseMenu.SubmenuRoot>
            <BaseMenu.SubmenuTrigger>Share</BaseMenu.SubmenuTrigger>
            <Menu.Content data-testid="submenu">
              <Menu.Item>Email</Menu.Item>
              <Menu.Item>Link</Menu.Item>
            </Menu.Content>
          </BaseMenu.SubmenuRoot>
        </Menu.Content>
      </Menu.Root>
      <input aria-label="After" />
    </div>
  );
}

/** Renders the fixture and opens it by click: the popup takes focus */
async function openMenu(props?: Parameters<typeof menuFixture>[0]) {
  const view = render(menuFixture(props));
  const trigger = view.getByRole("button", { name: "Options" });
  await userEvent.click(trigger);
  const popup = await view.findByTestId("popup");
  await expect
    .poll(() => popup.contains(document.activeElement), { timeout: SETTLE_TIMEOUT_MS })
    .toBe(true);
  // Open at rest: closed during its entry, the CSS path's popup can leave at once
  await settled(popup);
  return {
    trigger,
    popup,
    before: view.getByRole("textbox", { name: "Before" }),
    after: view.getByRole("textbox", { name: "After" }),
  };
}

/** Whether `el` has taken focus since the call */
function tookFocus(el: HTMLElement) {
  let focused = false;
  el.addEventListener("focus", () => {
    focused = true;
  });
  return () => focused;
}

const unmounted = (popup: HTMLElement) =>
  expect.poll(() => popup.isConnected, { timeout: SETTLE_TIMEOUT_MS }).toBe(false);
