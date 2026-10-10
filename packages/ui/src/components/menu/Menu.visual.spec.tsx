import { describe, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { renderFixture, renderPage, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
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
    // Opened with the mouse, so the focused popup shows no focus ring for the arrow's base to cover
    await userEvent.click(page.getByRole("button", { name: "Options" }));
    await commands.parkPointer();
    // The arrow's border is faint against the page, so compare colours closely
    await expect(body).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });
});
