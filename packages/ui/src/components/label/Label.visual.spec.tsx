import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../checkbox";
import { Label } from "./index";

const looks = (el: Element) => {
  const { opacity, cursor } = getComputedStyle(el);
  return { opacity, cursor };
};

describe("Label", () => {
  it("dims and shows a not-allowed cursor with `disabled`", () => {
    const { getByText } = render(
      <div className="flex items-center gap-2">
        <Label htmlFor="terms" disabled>
          Terms
        </Label>
        <Checkbox.Root id="terms" disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Label htmlFor="news">News</Label>
        <Checkbox.Root id="news">
          <Checkbox.Indicator />
        </Checkbox.Root>
      </div>,
    );
    expect(looks(getByText("Terms"))).toEqual({ opacity: "0.5", cursor: "not-allowed" });
    expect(looks(getByText("News"))).toEqual({ opacity: "1", cursor: "default" });
  });

  // The look keys on `data-disabled` alone, so one class in className restyles it
  it("takes a `data-disabled:` class over its own disabled look", () => {
    const { getByText } = render(
      <Label disabled className="data-disabled:opacity-75">
        Terms
      </Label>,
    );
    expect(looks(getByText("Terms"))).toEqual({ opacity: "0.75", cursor: "not-allowed" });
  });
});
