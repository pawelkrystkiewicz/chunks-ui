import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Accordion } from "./index";

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
});
