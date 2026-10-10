import { describe, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import { renderFixture, renderPage, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
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

  it.each(["top", "right", "bottom", "left"] as const)("arrow, side %s", async (side) => {
    const body = await renderPage(
      <div style={{ padding: 120, display: "flex", justifyContent: "center" }}>
        <Popover.Root>
          <Popover.Trigger render={<Button variant="outlined" />}>Trigger</Popover.Trigger>
          <Popover.Content side={side}>
            <Popover.Arrow />
            <Popover.Title>Title</Popover.Title>
          </Popover.Content>
        </Popover.Root>
      </div>,
    );
    // Opened with the mouse, so the focused popup draws no focus ring over the arrow's base
    await userEvent.click(page.getByRole("button", { name: "Trigger" }));
    await commands.parkPointer();
    // The arrow's border is faint against the page, so compare colours closely
    await expect(body).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
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
