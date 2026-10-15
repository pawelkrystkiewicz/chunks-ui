import type { Slider as BaseSlider } from "@base-ui/react/slider";
import { cleanup, render, screen } from "@testing-library/react";
import {
  type ComponentProps,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { Slider, type SliderRootProps } from "./Slider";
import type { SliderLabels } from "./Slider.Labels";

afterEach(cleanup);

// Erased at runtime: `check-types` fails when Slider.Root stops inferring Value (#413)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

/** A `useState` setter, as a type: `useState` itself runs only in a rendering component */
type Setter<T> = Dispatch<SetStateAction<T>>;

const single: number = 50;
const setSingle: Setter<number> = () => {};
const range: number[] = [20, 80];
const setRange: Setter<number[]> = () => {};
const frozen: readonly number[] = [20, 80];
const setFrozen: Setter<readonly number[]> = () => {};

describe("Slider.Root types", () => {
  it("takes a typed useState setter as onValueChange", () => {
    function Controlled() {
      const [value, setValue] = useState(50);
      return (
        <Slider.Root value={value} onValueChange={setValue}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Thumb aria-label="Volume" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      );
    }
    function ControlledRange() {
      const [value, setValue] = useState([20, 80]);
      return (
        <Slider.Root value={value} onValueChange={setValue}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Thumb index={0} aria-label="Min" />
              <Slider.Thumb index={1} aria-label="Max" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      );
    }
    render(
      <>
        <Controlled />
        <ControlledRange />
      </>,
    );
    expect(screen.getByRole("slider", { name: "Volume" })).toHaveValue("50");
    expect(screen.getByRole("slider", { name: "Min" })).toHaveValue("20");
    expect(screen.getByRole("slider", { name: "Max" })).toHaveValue("80");
  });

  it("infers a number or an array from value or defaultValue", () => {
    typeChecks(
      <Slider.Root value={single} onValueChange={setSingle} />,
      <Slider.Root defaultValue={single} onValueChange={setSingle} />,
      <Slider.Root value={range} onValueChange={setRange} />,
      <Slider.Root defaultValue={range} onValueChange={setRange} />,
      <Slider.Root value={frozen} onValueChange={setFrozen} />,
      <Slider.Root
        value={range}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number[]>()}
      />,
    );
    expectTypeOf<SliderRootProps<number>["value"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SliderRootProps<number[]>["value"]>().toEqualTypeOf<number[] | undefined>();
  });

  it("rejects a setter of the other shape", () => {
    typeChecks(
      // @ts-expect-error a single value does not take a range setter
      <Slider.Root value={single} onValueChange={setRange} />,
      // @ts-expect-error a range does not take a single-value setter
      <Slider.Root value={range} onValueChange={setSingle} />,
    );
  });

  it("keeps number | readonly number[] without a value, as before", () => {
    typeChecks(
      <Slider.Root
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number | readonly number[]>()}
      />,
    );
    // The type the wrapper had before it was generic. Pinned as mutual assignability with the same
    // keys and members: `ComponentProps` adds the `ref` of Base UI's call signature as a second
    // intersection member, which expect-type's identity check tells apart from the same `ref` once
    type Before = ComponentProps<typeof BaseSlider.Root> & { labels?: Partial<SliderLabels> };
    expectTypeOf<SliderRootProps>().toExtend<Before>();
    expectTypeOf<Before>().toExtend<SliderRootProps>();
    expectTypeOf<keyof SliderRootProps>().toEqualTypeOf<keyof Before>();
    expectTypeOf<SliderRootProps["value"]>().toEqualTypeOf<Before["value"]>();
    expectTypeOf<SliderRootProps["onValueChange"]>().toEqualTypeOf<Before["onValueChange"]>();
    expectTypeOf<SliderRootProps["ref"]>().toEqualTypeOf<Before["ref"]>();
  });
});
