import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { expectDimmed } from "../../VisualTest.utils";
import { Collapsible } from "./index";

describe("Collapsible", () => {
  // Base UI (1.9+) gives a disabled <button> trigger the disabled attribute, and a trigger
  // rendered as another element aria-disabled
  it.each<[string, { root?: boolean; trigger?: boolean; div?: boolean }]>([
    ["root", { root: true }],
    ["trigger", { trigger: true }],
    ["trigger, rendered as a div", { trigger: true, div: true }],
  ])("dims a trigger disabled on the %s", (_, disabled) => {
    const { getByRole } = render(
      <>
        <Collapsible.Root disabled={disabled.root}>
          <Collapsible.Trigger
            disabled={disabled.trigger}
            nativeButton={!disabled.div}
            render={disabled.div ? <div /> : undefined}
          >
            Disabled
          </Collapsible.Trigger>
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
