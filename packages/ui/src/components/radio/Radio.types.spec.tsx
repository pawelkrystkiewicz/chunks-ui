import type { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, type ReactElement, useState } from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { Radio, type RadioGroupProps } from "./Radio";

afterEach(cleanup);

// Erased at runtime: `check-types` fails when Radio.Group stops inferring Value (#413)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

// `as`, not an annotation: TS narrows `const value: "a" | "b" = "a"` to "a" at every use
const value = "a" as "a" | "b";
const onLetter = (_next: "a" | "b") => {};
const onNumber = (_next: number) => {};

describe("Radio.Group types", () => {
  it("takes a typed useState setter as onValueChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [letter, setLetter] = useState<"a" | "b">("a");
      return (
        <Radio.Group value={letter} onValueChange={setLetter} aria-label="Letter">
          <Radio.Item value="a">A</Radio.Item>
          <Radio.Item value="b">B</Radio.Item>
        </Radio.Group>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("radio", { name: "A" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "B" }));
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "A" })).not.toBeChecked();
  });

  it("infers Value from value, defaultValue or an annotated onValueChange", () => {
    typeChecks(
      <Radio.Group
        value={value}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<"a" | "b">()}
      />,
      // The inline callback gives Value no candidate of its own, so only defaultValue pins it
      <Radio.Group
        defaultValue={value}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<"a" | "b">()}
      />,
      // Nothing else types Value, so this compiles only when the handler's parameter is inferred
      <Radio.Group onValueChange={onLetter} />,
    );
    expectTypeOf<RadioGroupProps<"a" | "b">["value"]>().toEqualTypeOf<"a" | "b" | undefined>();
  });

  it("keeps a literal default widened", () => {
    typeChecks(
      <Radio.Group
        defaultValue="a"
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<string>()}
      />,
    );
  });

  it("rejects a setter of another type", () => {
    typeChecks(
      // @ts-expect-error the value is "a" | "b", so the setter cannot take a number
      <Radio.Group value={value} onValueChange={onNumber} />,
    );
  });

  it("keeps unknown without a value, as before", () => {
    typeChecks(<Radio.Group onValueChange={(next) => expectTypeOf(next).toBeUnknown()} />);
    expectTypeOf<RadioGroupProps>().toEqualTypeOf<ComponentProps<typeof BaseRadioGroup>>();
  });
});
