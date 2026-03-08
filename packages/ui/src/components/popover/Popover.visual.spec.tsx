import { describe, it } from "vitest";
import { renderFixture, renderPage } from "../../VisualTest.utils";
import { Button } from "../button";
import { Popover } from "./index";

describe("Popover", () => {
  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Popover.Root defaultOpen>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content>
            <Popover.Arrow />
            <Popover.Title>Popover Title</Popover.Title>
            <Popover.Description>Popover description content goes here.</Popover.Description>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("trigger", async () => {
    const { fixture } = await renderFixture(
      <Popover.Root>
        <Popover.Trigger render={<Button variant="outlined" />}>Open Popover</Popover.Trigger>
      </Popover.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
