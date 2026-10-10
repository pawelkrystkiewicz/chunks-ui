import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Collapsible } from "./index";

describe("Collapsible", () => {
  // Base UI keeps a disabled trigger focusable, so it is aria-disabled and never :disabled
  it.each<[string, { root?: boolean; trigger?: boolean }]>([
    ["root", { root: true }],
    ["trigger", { trigger: true }],
  ])("dims a trigger disabled on the %s", (_, disabled) => {
    const { getByRole } = render(
      <>
        <Collapsible.Root disabled={disabled.root}>
          <Collapsible.Trigger disabled={disabled.trigger}>Disabled</Collapsible.Trigger>
          <Collapsible.Panel>Content</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root>
          <Collapsible.Trigger>Enabled</Collapsible.Trigger>
          <Collapsible.Panel>Content</Collapsible.Panel>
        </Collapsible.Root>
      </>,
    );
    const style = (name: string) => {
      const { opacity, pointerEvents } = getComputedStyle(getByRole("button", { name }));
      return { opacity, pointerEvents };
    };
    expect(style("Disabled")).toEqual({ opacity: "0.5", pointerEvents: "none" });
    expect(style("Enabled")).toEqual({ opacity: "1", pointerEvents: "auto" });
  });
});
