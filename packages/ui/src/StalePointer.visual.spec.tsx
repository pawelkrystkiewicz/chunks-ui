import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Accordion } from "./components/accordion";
import { renderFixture, waitForStable } from "./VisualTest.utils";

// Accordion.Trigger has a hover colour, so a pointer resting on it shows in a screenshot
const accordion = (
  <Accordion.Root>
    <Accordion.Item value="item-1">
      <Accordion.Header>
        <Accordion.Trigger>Section 1</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>Content 1</Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item value="item-2">
      <Accordion.Header>
        <Accordion.Trigger>Section 2</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>Content 2</Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
);

const screenshot = (element: Element) => page.screenshot({ element, save: false });

// The browser keeps the pointer where the last test left it, across tests and spec files, and
// hovers whatever renders under it next. The tests run in order: the first leaves the pointer
// on the trigger, at the spot where the second renders the same trigger.
describe("a pointer left by the previous test", { shuffle: false }, () => {
  let unhovered: string | undefined;

  it("hovers the trigger it rests on", async () => {
    const { fixture, getByRole } = await renderFixture(accordion);
    unhovered = await screenshot(fixture);

    const trigger = getByRole("button", { name: "Section 1" });
    await userEvent.hover(trigger);
    await expect.poll(() => trigger.matches(":hover")).toBe(true);
    expect(await screenshot(fixture)).not.toBe(unhovered);
  });

  it("is moved off the fixture before the next test", async () => {
    const { fixture, getByRole } = await renderFixture(accordion);
    const trigger = getByRole("button", { name: "Section 1" });
    // The browser updates hover a frame or two after a render, so give it the time
    expect(await waitForStable(() => trigger.matches(":hover"))).toBe(false);
    expect(await screenshot(fixture)).toBe(unhovered);
  });
});
