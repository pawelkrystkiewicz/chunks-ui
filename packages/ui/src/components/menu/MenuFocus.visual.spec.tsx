import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { describeMotionPaths, waitForStable } from "../../VisualTest.utils";
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

describe.each([{ arrow: false }, { arrow: true }])(
  "Menu popup focused as the pointer leaves an item, with arrow $arrow",
  ({ arrow }) => {
    it("draws no ring on the popup's padding, a separator, or outside the menu", async () => {
      const popup = await openedFromTheKeyboardThenHovered(arrow);
      const { height } = popup.getBoundingClientRect();
      const moves = [
        // Inside the 1px border, in the 4px of padding before the items
        {
          to: "padding",
          hover: () => userEvent.hover(popup, { position: { x: 3, y: height / 2 } }),
        },
        { to: "separator", hover: () => userEvent.hover(screen.getByTestId("separator")) },
        // The page's corner: Base UI's backdrop takes the pointer there, not the "Before" button
        {
          to: "outside",
          hover: () => userEvent.hover(document.body, { position: { x: 5, y: 5 } }),
        },
      ];
      for (const { to, hover } of moves) {
        await userEvent.hover(screen.getByRole("menuitem", { name: "Edit" }));
        await hover();
        // Base UI moves the focus to the popup, and Chromium keeps the keyboard modality
        expect(document.activeElement, to).toBe(popup);
        expect(popup.matches(":focus-visible"), to).toBe(true);
        expect(ringOf(popup), to).toBe(false);
      }
    });

    it("draws the ring again on the next key press", async () => {
      const popup = await openedFromTheKeyboardThenHovered(arrow);
      await userEvent.hover(screen.getByTestId("separator"));
      expect(document.activeElement).toBe(popup);
      expect(ringOf(popup)).toBe(false);
      // Moves no focus; the ring is read in the same task as the key
      await userEvent.keyboard("{Shift}");
      expect(document.activeElement).toBe(popup);
      expect(ringOf(popup)).toBe(true);
    });
  },
);

// The handlers reach the popup through `createPopupRenderer`'s `motion.div` when Motion springs it
describeMotionPaths("Menu popup pointer flag", (reducedMotion) => {
  it("is set by a real pointer move and hides the ring", async () => {
    const popup = await openedFromTheKeyboardThenHovered(false);
    const { height } = popup.getBoundingClientRect();
    await userEvent.hover(popup, { position: { x: 3, y: height / 2 } });
    expect(document.activeElement).toBe(popup);
    expect(popup.matches(":focus-visible")).toBe(true);
    expect(popup).toHaveAttribute("data-pointer");
    expect(ringOf(popup)).toBe(false);
    // Whether Motion drives the popup: it sets inline transform styles
    expect(popup.style.transform !== "").toBe(reducedMotion === "no-preference");
  });
});
