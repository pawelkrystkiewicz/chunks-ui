import type { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cleanup, render, screen } from "@testing-library/react";
import {
  type ComponentProps,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { Radio, type RadioGroupProps } from "./Radio";

afterEach(cleanup);

// Erased at runtime: `check-types` fails when Radio.Group stops inferring Value (#413)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

/** A `useState` setter, as a type: `useState` itself runs only in a rendering component */
type Setter<T> = Dispatch<SetStateAction<T>>;

// `as`, not an annotation: TS narrows `const value: "a" | "b" = "a"` to "a" at every use
const value = "a" as "a" | "b";
const setValue: Setter<"a" | "b"> = () => {};
const setNumber: Setter<number> = () => {};

describe("Radio.Group types", () => {
  it("takes a typed useState setter as onValueChange", () => {
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
  });

  it("infers Value from value or defaultValue", () => {
    typeChecks(
      <Radio.Group value={value} onValueChange={setValue} />,
      <Radio.Group defaultValue={value} onValueChange={setValue} />,
      <Radio.Group
        value={value}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<"a" | "b">()}
      />,
    );
    expectTypeOf<RadioGroupProps<"a" | "b">["value"]>().toEqualTypeOf<"a" | "b" | undefined>();
  });

  it("rejects a setter of another type", () => {
    typeChecks(
      // @ts-expect-error the value is "a" | "b", so the setter cannot take a number
      <Radio.Group value={value} onValueChange={setNumber} />,
    );
  });

  it("keeps unknown without a value, as before", () => {
    typeChecks(<Radio.Group onValueChange={(next) => expectTypeOf(next).toBeUnknown()} />);
    expectTypeOf<RadioGroupProps>().toEqualTypeOf<ComponentProps<typeof BaseRadioGroup>>();
  });
});
