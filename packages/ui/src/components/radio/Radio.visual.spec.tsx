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

  it("dims a disabled item, its radio and its label, once", () => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a">
        <Radio.Item value="a">Enabled</Radio.Item>
        <Radio.Item value="b" disabled>
          Disabled
        </Radio.Item>
      </Radio.Group>,
    );
    const drawn = (name: string) => ({
      radio: drawnOpacity(getByRole("radio", { name })),
      label: drawnOpacity(getByText(name)),
    });
    expect(drawn("Disabled")).toEqual({ radio: 0.5, label: 0.5 });
    expect(drawn("Enabled")).toEqual({ radio: 1, label: 1 });
  });

  it("dims the items of a disabled group once", () => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a" disabled>
        <Radio.Item value="a">Option</Radio.Item>
      </Radio.Group>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(0.5);
    expect(drawnOpacity(getByText("Option"))).toBe(0.5);
  });

  it("dims a disabled item of a disabled group once", () => {
    const { getByRole, getByText } = render(
      <Radio.Group defaultValue="a" disabled>
        <Radio.Item value="a" disabled>
          Option
        </Radio.Item>
      </Radio.Group>,
    );
    expect(drawnOpacity(getByRole("radio", { name: "Option" }))).toBe(0.5);
    expect(drawnOpacity(getByText("Option"))).toBe(0.5);
  });
});
