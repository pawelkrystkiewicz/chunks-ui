import type { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { ToggleGroup, type ToggleGroupRootProps } from "./ToggleGroup";

// Erased at runtime: `check-types` fails when ToggleGroup.Root stops inferring Value (#442)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

afterEach(cleanup);

const letters: readonly ("a" | "b")[] = [];
const onLetters = (_next: ("a" | "b")[]) => {};

describe("ToggleGroup.Root types", () => {
  it("takes a typed useState setter as onValueChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<("a" | "b")[]>(["a"]);
      // multiple: a single-select group watches its items with a ResizeObserver, which jsdom lacks
      return (
        <ToggleGroup.Root multiple value={value} onValueChange={setValue} aria-label="Letter">
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
    expect(a).toHaveAttribute("aria-pressed", "true");
    expect(b).toHaveAttribute("aria-pressed", "true");
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
  });

  it("pins the item type to a literal default, as Base UI does", () => {
    // Value extends string, so an inline literal default stays a literal; an annotation or <string> widens it
    typeChecks(
      <ToggleGroup.Root
        defaultValue={["a"]}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<"a"[]>()}
      />,
      <ToggleGroup.Root
        defaultValue={["a"]}
        onValueChange={(next: string[]) => next.includes("b")}
      />,
      <ToggleGroup.Root<string>
        defaultValue={["a"]}
        onValueChange={(next) => next.includes("b")}
      />,
      <ToggleGroup.Root
        defaultValue={["a"]}
        // @ts-expect-error "b" is not in "a"[]: the symptom both escapes above remove
        onValueChange={(next) => next.includes("b")}
      />,
    );
  });

  it("keeps string[] without a value, as before", () => {
    typeChecks(
      <ToggleGroup.Root onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<string[]>()} />,
    );
    // Base UI's own default
    expectTypeOf<ToggleGroupRootProps>().toEqualTypeOf<BaseToggleGroup.Props>();
  });
});
