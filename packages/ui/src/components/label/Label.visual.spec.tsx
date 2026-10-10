import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../checkbox";
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

describe("Label", () => {
  it.each<[string, (disabled: boolean) => ReactNode]>([
    [
      "after a Checkbox",
      (disabled) => (
        <>
          {checkbox(disabled)}
          {label}
        </>
      ),
    ],
    [
      "after a Switch",
      (disabled) => (
        <>
          {toggle(disabled)}
          {label}
        </>
      ),
    ],
    [
      "after a native input marked peer",
      (disabled) => (
        <>
          {peerInput(disabled)}
          {label}
        </>
      ),
    ],
    [
      "before a Checkbox",
      (disabled) => (
        <>
          {label}
          {checkbox(disabled)}
        </>
      ),
    ],
    [
      "before a Switch",
      (disabled) => (
        <>
          {label}
          {toggle(disabled)}
        </>
      ),
    ],
    [
      "before a native input",
      (disabled) => (
        <>
          {label}
          {input(disabled)}
        </>
      ),
    ],
  ])("dims %s that is disabled", (_, controls) => {
    const style = (disabled: boolean) => {
      const { getByText, unmount } = render(
        <div className="flex items-center gap-2">{controls(disabled)}</div>,
      );
      const { opacity, cursor } = getComputedStyle(getByText("Label"));
      unmount();
      return { opacity, cursor };
    };
    expect(style(true)).toEqual({ opacity: "0.5", cursor: "not-allowed" });
    expect(style(false)).toEqual({ opacity: "1", cursor: "default" });
  });
});
