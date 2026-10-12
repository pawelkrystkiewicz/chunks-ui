import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Radio } from "../radio";
import { Switch } from "../switch";
import { Label } from "./index";

const label = (
  <Label key="label" htmlFor="control">
    Label
  </Label>
);

const dimmed = { opacity: "0.5", cursor: "not-allowed" };
const normal = { opacity: "1", cursor: "default" };

const looks = (el: Element) => {
  const { opacity, cursor } = getComputedStyle(el);
  return { opacity, cursor };
};

describe("Label", () => {
  // `controlFirst` puts the control before the label, which only a `peer` control can dim
  it.each<[string, (disabled: boolean) => ReactNode, boolean]>([
    [
      "placed right before a Checkbox",
      (disabled) => (
        <Checkbox.Root id="control" disabled={disabled}>
          <Checkbox.Indicator />
        </Checkbox.Root>
      ),
      false,
    ],
    [
      "placed right before a native input",
      (disabled) => <input id="control" disabled={disabled} />,
      false,
    ],
    [
      "placed right before an Input with adornments",
      (disabled) => <Input id="control" disabled={disabled} startAdornment="$" />,
      false,
    ],
    [
      "placed after a native input marked peer",
      (disabled) => <input id="control" className="peer" disabled={disabled} />,
      true,
    ],
  ])("dims when %s that is disabled", (_, control, controlFirst) => {
    const style = (disabled: boolean) => {
      const { getByText, unmount } = render(
        <div className="flex items-center gap-2">
          {controlFirst ? [control(disabled), label] : [label, control(disabled)]}
        </div>,
      );
      const result = looks(getByText("Label"));
      unmount();
      return result;
    };
    expect(style(true)).toEqual(dimmed);
    expect(style(false)).toEqual(normal);
  });

  it("dims before an Input with adornments in a disabled fieldset", () => {
    const { getByText } = render(
      <fieldset disabled>
        <Label htmlFor="price">Price</Label>
        <Input id="price" startAdornment="$" />
      </fieldset>,
    );
    expect(looks(getByText("Price"))).toEqual(dimmed);
  });

  // Only a disabled input inside the wrapper counts, not a disabled button in an adornment
  it("doesn't dim before an enabled Input whose adornment holds a disabled button", () => {
    const { getByText } = render(
      <div className="flex items-center gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          endAdornment={
            <button type="button" disabled>
              Apply
            </button>
          }
        />
      </div>,
    );
    expect(looks(getByText("Code"))).toEqual(normal);
  });

  // Base UI renders a hidden `<input disabled>` inside the next sibling of a Radio.Group's label
  it("doesn't dim before a Radio.Group with one disabled root", () => {
    const { getByText } = render(
      <div>
        <Label>Plan</Label>
        <Radio.Group defaultValue="a" aria-label="Plan">
          <Radio.Root value="a" aria-label="Free">
            <Radio.Indicator />
          </Radio.Root>
          <Radio.Root value="b" aria-label="Pro" disabled>
            <Radio.Indicator />
          </Radio.Root>
        </Radio.Group>
      </div>,
    );
    expect(looks(getByText("Plan"))).toEqual(normal);
  });

  it("next to an Input with adornments, enabled and disabled", async () => {
    const { fixture } = await renderFixture(
      <div className="grid grid-cols-[auto_200px] items-center gap-3">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" startAdornment="$" defaultValue="40" />
        <Label htmlFor="limit">Limit</Label>
        <Input id="limit" startAdornment="$" defaultValue="100" disabled />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // Checkbox, Switch and Radio.Root carry the `peer` class, so a `peer-*` style would reach
  // every later sibling of a disabled one, not just its own label
  it("dims only the label right before a disabled control in a flat label-first grid", () => {
    const { getByText } = render(
      <div className="grid grid-cols-2 items-center gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
        <Label htmlFor="alerts">Alerts</Label>
        <Switch.Root id="alerts" disabled>
          <Switch.Thumb />
        </Switch.Root>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </div>,
    );
    expect(looks(getByText("Name"))).toEqual(normal);
    expect(looks(getByText("Alerts"))).toEqual(dimmed);
    expect(looks(getByText("Email"))).toEqual(normal);
  });
});
