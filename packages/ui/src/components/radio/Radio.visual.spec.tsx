import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFixture, SMALL_FEATURE_SCREENSHOT } from "../../VisualTest.utils";
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
    await expect(fixture).toMatchScreenshot(SMALL_FEATURE_SCREENSHOT);
  });

  // The radio and its text are each drawn at 0.5, never 0.25 from dimming both the item and its parts
  it.each<[string, { group?: boolean; item?: boolean }]>([
    ["a disabled item", { item: true }],
    ["the items of a disabled group", { group: true }],
    ["a disabled item of a disabled group", { group: true, item: true }],
  ])("dims %s once", (_, disabled) => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a" disabled={disabled.group}>
        <Radio.Item value="a" disabled={disabled.item}>
          Option
        </Radio.Item>
      </Radio.Group>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(0.5);
    expect(drawnOpacity(getByText("Option"))).toBe(0.5);
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
