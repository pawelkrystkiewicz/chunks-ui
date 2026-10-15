import type { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, type ReactElement, useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, expectTypeOf, it } from "vitest";
import { ToggleGroup, type ToggleGroupRootProps } from "./ToggleGroup";

// Erased at runtime: `check-types` fails when ToggleGroup.Root stops inferring Value (#442)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

// jsdom has no ResizeObserver, and a single-select group watches its items for the indicator
const realResizeObserver = globalThis.ResizeObserver;
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  globalThis.ResizeObserver = realResizeObserver;
});
afterEach(cleanup);

const letters: readonly ("a" | "b")[] = [];
const onLetters = (_next: ("a" | "b")[]) => {};
const onNumbers = (_next: number[]) => {};

describe("ToggleGroup.Root types", () => {
  it("takes a typed useState setter as onValueChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<("a" | "b")[]>(["a"]);
      return (
        <ToggleGroup.Root value={value} onValueChange={setValue} aria-label="Letter">
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup.Root>
      );
    }
    render(<Controlled />);
    const a = screen.getByRole("button", { name: "A" });
    const b = screen.getByRole("button", { name: "B" });
    expect(a).toHaveAttribute("aria-pressed", "true");
    await user.click(b);
    expect(b).toHaveAttribute("aria-pressed", "true");
    expect(a).toHaveAttribute("aria-pressed", "false");
  });

  it("infers the item type from value, defaultValue or an annotated onValueChange", () => {
    typeChecks(
      <ToggleGroup.Root
        value={letters}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<("a" | "b")[]>()}
      />,
      // The inline callback gives Value no candidate of its own, so only defaultValue pins it
      <ToggleGroup.Root
        defaultValue={letters}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<("a" | "b")[]>()}
      />,
      // Nothing else types Value, so this compiles only when the handler's parameter is inferred
      <ToggleGroup.Root onValueChange={onLetters} />,
    );
    expectTypeOf<ToggleGroupRootProps<"a" | "b">["value"]>().toEqualTypeOf<
      readonly ("a" | "b")[] | undefined
    >();
  });

  it("pins the item type to a literal default, as Base UI does", () => {
    // Base UI constrains Value to string, and TypeScript keeps a literal it infers for such a type
    // parameter, so an inline `defaultValue={["a"]}` types `next` as "a"[], not string[] (Radio.Group
    // and Accordion.Root widen: their Value is unconstrained). An annotated handler takes the
    // wider type.
    typeChecks(
      <ToggleGroup.Root
        defaultValue={["a"]}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<"a"[]>()}
      />,
      <ToggleGroup.Root
        defaultValue={["a"]}
        onValueChange={(next: string[]) => next.includes("b")}
      />,
    );
  });

  it("rejects a setter of another item type", () => {
    typeChecks(
      // @ts-expect-error the items are "a" | "b", so the setter cannot take numbers
      <ToggleGroup.Root value={letters} onValueChange={onNumbers} />,
    );
  });

  it("keeps string[] without a value, as before", () => {
    typeChecks(
      <ToggleGroup.Root onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<string[]>()} />,
    );
    // Base UI's own default. ComponentProps<typeof BaseToggleGroup>, the type before Root was
    // generic, is these props intersected with RefAttributes<HTMLDivElement> from Base UI's call
    // signature: the same members (ref included), so the two are interchangeable, not identical.
    expectTypeOf<ToggleGroupRootProps>().toEqualTypeOf<BaseToggleGroup.Props>();
    expectTypeOf<ToggleGroupRootProps>().toExtend<ComponentProps<typeof BaseToggleGroup>>();
    expectTypeOf<ComponentProps<typeof BaseToggleGroup>>().toExtend<ToggleGroupRootProps>();
  });
});
