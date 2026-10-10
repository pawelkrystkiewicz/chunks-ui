import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { renderFixture } from "../../VisualTest.utils";
import { Accordion } from "./index";

/** The element's rotation in degrees, from the `rotate` property or its transform matrix */
function rotation(el: Element) {
  const style = getComputedStyle(el);
  if (style.rotate !== "none") return Number.parseFloat(style.rotate);
  const m = new DOMMatrix(style.transform);
  return Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI);
}

const chevron = (trigger: Element) => trigger.querySelector("svg") as SVGElement;

describe("Accordion", () => {
  it("collapsed", async () => {
    const { fixture } = await renderFixture(
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
        <Accordion.Item value="item-3">
          <Accordion.Header>
            <Accordion.Trigger>Section 3</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content 3</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("expanded", async () => {
    const { fixture } = await renderFixture(
      <Accordion.Root defaultValue={["item-1"]}>
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
        <Accordion.Item value="item-3">
          <Accordion.Header>
            <Accordion.Trigger>Section 3</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content 3</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("turns the chevron of an open item upside down", async () => {
    const { getByRole } = render(
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Open</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>Closed</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const open = getByRole("button", { name: "Open" });
    const closed = getByRole("button", { name: "Closed" });
    expect(rotation(chevron(open))).toBe(180);
    expect(rotation(chevron(closed))).toBe(0);

    await userEvent.click(open);
    await expect.poll(() => rotation(chevron(open))).toBe(0);
    await userEvent.click(closed);
    await expect.poll(() => rotation(chevron(closed))).toBe(180);
  });

  // Base UI keeps a disabled trigger focusable, so it is aria-disabled and never :disabled
  it.each<[string, { item?: boolean; trigger?: boolean }]>([
    ["item", { item: true }],
    ["trigger", { trigger: true }],
  ])("dims a trigger disabled on the %s", (_, disabled) => {
    const { getByRole } = render(
      <Accordion.Root>
        <Accordion.Item value="a" disabled={disabled.item}>
          <Accordion.Header>
            <Accordion.Trigger disabled={disabled.trigger}>Disabled</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>Enabled</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const style = (name: string) => {
      const { opacity, pointerEvents } = getComputedStyle(getByRole("button", { name }));
      return { opacity, pointerEvents };
    };
    expect(style("Disabled")).toEqual({ opacity: "0.5", pointerEvents: "none" });
    expect(style("Enabled")).toEqual({ opacity: "1", pointerEvents: "auto" });
  });
});
