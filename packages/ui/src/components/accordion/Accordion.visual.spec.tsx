import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectDimmed, renderFixture } from "../../VisualTest.utils";
import { Accordion } from "./index";

/** The element's rotation in degrees, from the `rotate` property Tailwind v4 emits */
const rotation = (el: Element) => Number.parseFloat(getComputedStyle(el).rotate) || 0;

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

  // Base UI (1.9+) gives a disabled <button> trigger the disabled attribute, and a trigger
  // rendered as another element aria-disabled
  it.each<[string, { root?: boolean; item?: boolean; trigger?: boolean; div?: boolean }]>([
    ["root", { root: true }],
    ["item", { item: true }],
    ["trigger", { trigger: true }],
    ["trigger, rendered as a div", { trigger: true, div: true }],
  ])("dims a trigger disabled on the %s", (_, disabled) => {
    const { getByRole } = render(
      <>
        <Accordion.Root disabled={disabled.root}>
          <Accordion.Item value="a" disabled={disabled.item}>
            <Accordion.Header>
              <Accordion.Trigger
                disabled={disabled.trigger}
                nativeButton={!disabled.div}
                render={disabled.div ? <div /> : undefined}
              >
                Disabled
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Content</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
        <Accordion.Root>
          <Accordion.Item value="b">
            <Accordion.Header>
              <Accordion.Trigger>Enabled</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Content</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </>,
    );
    expectDimmed(
      getByRole("button", { name: "Disabled" }),
      getByRole("button", { name: "Enabled" }),
    );
  });
});
