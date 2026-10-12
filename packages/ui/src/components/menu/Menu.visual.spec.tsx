import { describe, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { renderFixture, renderPage } from "../../VisualTest.utils";
import { Menu } from "./index";

describe("Menu", () => {
  it("trigger", async () => {
    const { fixture } = await renderFixture(
      <Menu.Root>
        <Menu.Trigger>Options</Menu.Trigger>
      </Menu.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Options</Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Copy</Menu.Item>
            <Menu.Separator />
            <Menu.Item>Delete</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("open with arrow", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Menu.Root>
          <Menu.Trigger>Options</Menu.Trigger>
          <Menu.Content>
            <Menu.Arrow />
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Copy</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>,
    );
    // Opened with the mouse, so the focused popup shows no focus ring; the next spec has one
    await userEvent.click(page.getByRole("button", { name: "Options" }));
    await commands.parkPointer();
    await expect(body).toMatchScreenshot();
  });

  it("open with arrow, focused from the keyboard", async () => {
    // Enter or Space on the trigger would focus the first item. A menu that opens after a key
    // press, as from a shortcut, focuses the popup, and its ring must cross the arrow's base
    await userEvent.keyboard("{Shift}");
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Options</Menu.Trigger>
          <Menu.Content>
            <Menu.Arrow />
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Copy</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>,
    );
    const popup = page.getByRole("menu");
    await expect.poll(() => popup.element().matches(":focus-visible")).toBe(true);
    await expect(body).toMatchScreenshot();
  });
});
