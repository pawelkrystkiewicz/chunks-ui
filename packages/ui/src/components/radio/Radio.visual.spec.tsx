import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { renderFixture } from "../../VisualTest.utils";
import { Field } from "../field";
import { Radio } from "./index";

/** The opacity the element is drawn with: its own times every ancestor's */
function drawnOpacity(el: Element) {
  let opacity = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    opacity *= Number(getComputedStyle(node).opacity);
  }
  return opacity;
}

describe("Radio", () => {
  it("group", async () => {
    const { fixture } = await renderFixture(
      <Radio.Group defaultValue="b">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Radio.Item value="a">Option A</Radio.Item>
          <Radio.Item value="b">Option B</Radio.Item>
          <Radio.Item value="c" disabled>
            Option C (disabled)
          </Radio.Item>
        </div>
      </Radio.Group>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // The radio and its text are each drawn at 0.5, never 0.25 from dimming both the item and its parts
  it.each<[string, { group?: boolean; item?: boolean }]>([
    ["a disabled item", { item: true }],
    ["the items of a disabled group", { group: true }],
    ["a disabled item of a disabled group", { group: true, item: true }],
  ])("dims %s once and shows a not-allowed cursor", (_, disabled) => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a" disabled={disabled.group}>
        <Radio.Item value="a" disabled={disabled.item}>
          Option
        </Radio.Item>
      </Radio.Group>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(0.5);
    expect(drawnOpacity(getByText("Option"))).toBe(0.5);
    const label = getByText("Option").closest("label");
    expect(label && getComputedStyle(label).cursor).toBe("not-allowed");
  });

  // A Field.Root disables the radio through Base UI (`data-disabled`), not through the item's prop
  it.each<[string, boolean]>([
    ["an item of a disabled Field.Root", false],
    ["an item in a group of a disabled Field.Root", true],
  ])("dims %s once and shows a not-allowed cursor", (_, grouped) => {
    const item = <Radio.Item value="a">Option</Radio.Item>;
    const { getByRole, getByText } = render(
      <Field.Root disabled>
        {grouped ? <Radio.Group aria-label="Plan">{item}</Radio.Group> : item}
      </Field.Root>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(0.5);
    expect(drawnOpacity(getByText("Option"))).toBe(0.5);
    const label = getByText("Option").closest("label");
    expect(label && getComputedStyle(label).cursor).toBe("not-allowed");
  });

  // pointer-events: none would hide the not-allowed cursor; Base UI ignores the click anyway
  const looks = (el: Element) => ({
    opacity: drawnOpacity(el),
    cursor: getComputedStyle(el).cursor,
    pointerEvents: getComputedStyle(el).pointerEvents,
  });

  it("dims a disabled Radio.Root outside a disabled group and shows a not-allowed cursor", () => {
    const { getByRole } = render(
      <Radio.Group defaultValue="a">
        <Radio.Root value="a" aria-label="Enabled">
          <Radio.Indicator />
        </Radio.Root>
        <Radio.Root value="b" aria-label="Disabled" disabled>
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(looks(getByRole("radio", { name: "Disabled" }))).toEqual({
      opacity: 0.5,
      cursor: "not-allowed",
      pointerEvents: "auto",
    });
    expect(looks(getByRole("radio", { name: "Enabled" }))).toEqual({
      opacity: 1,
      cursor: "pointer",
      pointerEvents: "auto",
    });
  });

  // pointer-events: none no longer swallows the click, so the disabled root must not take focus
  it("keeps focus where it was when a disabled Radio.Root is clicked", async () => {
    const { getByRole } = render(
      <div>
        <input aria-label="Name" />
        <Radio.Group defaultValue="a">
          <Radio.Root value="a" aria-label="Enabled">
            <Radio.Indicator />
          </Radio.Root>
          <Radio.Root value="b" aria-label="Disabled" disabled>
            <Radio.Indicator />
          </Radio.Root>
        </Radio.Group>
      </div>,
    );
    const input = getByRole("textbox", { name: "Name" });
    input.focus();
    // force: Playwright refuses to click a disabled element, a user can
    await page.elementLocator(getByRole("radio", { name: "Disabled" })).click({ force: true });
    expect(document.activeElement).toBe(input);
  });

  it("keeps a non-disabled item's label not-allowed inside a disabled group", () => {
    const { getByText } = render(
      <Radio.Group defaultValue="a" disabled>
        <Radio.Item value="a">Option</Radio.Item>
      </Radio.Group>,
    );
    const label = getByText("Option").closest("label");
    expect(label && getComputedStyle(label).cursor).toBe("not-allowed");
  });

  it.each([
    ["the roots of a disabled group", false],
    ["a disabled root of a disabled group", true],
  ])("dims %s once", (_, rootDisabled) => {
    const { getByRole } = render(
      <Radio.Group defaultValue="a" disabled>
        <Radio.Root value="a" aria-label="Option" disabled={rootDisabled}>
          <Radio.Indicator />
        </Radio.Root>
      </Radio.Group>,
    );
    expect(looks(getByRole("radio", { name: "Option" }))).toMatchObject({
      opacity: 0.5,
      cursor: "not-allowed",
    });
  });

  it("leaves an enabled item undimmed", () => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a">
        <Radio.Item value="a">Option</Radio.Item>
      </Radio.Group>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(1);
    expect(drawnOpacity(getByText("Option"))).toBe(1);
  });
});
