import type { Slider as BaseSlider } from "@base-ui/react/slider";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, type ReactElement, useState } from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { Slider, type SliderRootProps } from "./Slider";
import type { SliderLabels } from "./Slider.Labels";

afterEach(cleanup);

// Erased at runtime: `check-types` fails when Slider.Root stops inferring Value (#413)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

const single: number = 50;
const range: number[] = [20, 80];
const frozen: readonly number[] = [20, 80];
const onSingle = (_next: number) => {};
const onRange = (_next: number[]) => {};
const onFrozen = (_next: readonly number[]) => {};

describe("Slider.Root types", () => {
  it("takes a typed useState setter as onValueChange", async () => {
    const user = userEvent.setup();
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
    const volume = screen.getByRole("slider", { name: "Volume" });
    const min = screen.getByRole("slider", { name: "Min" });
    const max = screen.getByRole("slider", { name: "Max" });
    // Tab order is Volume, Min, Max
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(volume).toHaveValue("51");
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(min).toHaveValue("21");
    expect(max).toHaveValue("80");
  });

  it("infers a number or an array from value, defaultValue or an annotated onValueChange", () => {
    typeChecks(
      // A readonly array satisfies the constraint
      <Slider.Root value={frozen} onValueChange={onFrozen} />,
      <Slider.Root
        value={range}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number[]>()}
      />,
      // The inline callback gives Value no candidate of its own, so only defaultValue pins it
      <Slider.Root
        defaultValue={range}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number[]>()}
      />,
      // Nothing else types Value, so this compiles only when the handler's parameter is inferred
      <Slider.Root onValueChange={onRange} />,
    );
    expectTypeOf<SliderRootProps<number[]>["value"]>().toEqualTypeOf<number[] | undefined>();
  });

  it("gives onValueChange a number for a literal default", () => {
    // `defaultValue={50}` infers Value as 50, since the constraint holds a primitive. The callback
    // still gets a number: Base UI types its parameter as `Value extends number ? number : Value`
    typeChecks(
      <Slider.Root
        defaultValue={50}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number>()}
      />,
    );
  });

  it("rejects a setter of the other shape", () => {
    typeChecks(
      // @ts-expect-error a single value does not take a range setter
      <Slider.Root value={single} onValueChange={onRange} />,
      // @ts-expect-error a range does not take a single-value setter
      <Slider.Root value={range} onValueChange={onSingle} />,
    );
  });

  it("keeps number | readonly number[] without a value, as before", () => {
    typeChecks(
      <Slider.Root
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<number | readonly number[]>()}
      />,
    );
    // Before it was generic: same keys, mutually assignable (an identity check trips on `ref`)
    type Before = ComponentProps<typeof BaseSlider.Root> & { labels?: Partial<SliderLabels> };
    expectTypeOf<SliderRootProps>().toExtend<Before>();
    expectTypeOf<Before>().toExtend<SliderRootProps>();
    expectTypeOf<keyof SliderRootProps>().toEqualTypeOf<keyof Before>();
  });
});
