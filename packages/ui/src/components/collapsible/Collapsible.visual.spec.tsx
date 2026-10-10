import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { expectDimmed } from "../../VisualTest.utils";
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
    expectDimmed(
      getByRole("button", { name: "Disabled" }),
      getByRole("button", { name: "Enabled" }),
    );
  });
});
