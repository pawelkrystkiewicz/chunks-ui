import { describe, it } from "vitest";
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
});
