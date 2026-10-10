import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Switch } from "../switch";
import { Label } from "./index";

const checkbox = (disabled: boolean) => (
  <Checkbox.Root id="control" disabled={disabled}>
    <Checkbox.Indicator />
  </Checkbox.Root>
);
const toggle = (disabled: boolean) => (
  <Switch.Root id="control" disabled={disabled}>
    <Switch.Thumb />
  </Switch.Root>
);
const input = (disabled: boolean) => <input id="control" disabled={disabled} />;
const peerInput = (disabled: boolean) => (
  <input id="control" className="peer" disabled={disabled} />
);

const label = <Label htmlFor="control">Label</Label>;

const dimmed = { opacity: "0.5", cursor: "not-allowed" };
const normal = { opacity: "1", cursor: "default" };

const looks = (el: Element) => {
  const { opacity, cursor } = getComputedStyle(el);
  return { opacity, cursor };
};

describe("Label", () => {
  it.each<[string, (disabled: boolean) => ReactNode]>([
    [
      "placed right before a Checkbox",
      (disabled) => (
        <>
          {label}
          {checkbox(disabled)}
        </>
      ),
    ],
    [
      "placed right before a Switch",
      (disabled) => (
        <>
          {label}
          {toggle(disabled)}
        </>
      ),
    ],
    [
      "placed right before a native input",
      (disabled) => (
        <>
          {label}
          {input(disabled)}
        </>
      ),
    ],
    [
      "placed after a native input marked peer",
      (disabled) => (
        <>
          {peerInput(disabled)}
          {label}
        </>
      ),
    ],
  ])("dims when %s that is disabled", (_, controls) => {
    const style = (disabled: boolean) => {
      const { getByText, unmount } = render(
        <div className="flex items-center gap-2">{controls(disabled)}</div>,
      );
      const result = looks(getByText("Label"));
      unmount();
      return result;
    };
    expect(style(true)).toEqual(dimmed);
    expect(style(false)).toEqual(normal);
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
