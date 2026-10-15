import type { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  type ComponentProps,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { Accordion, type AccordionRootProps } from "./Accordion";

afterEach(cleanup);

// Erased at runtime: `check-types` fails when Accordion.Root stops inferring Value (#413)

/** Holds JSX whose only job is to compile, or not to under `@ts-expect-error` */
function typeChecks(..._elements: ReactElement[]) {}

/** A `useState` setter, as a type: `useState` itself runs only in a rendering component */
type Setter<T> = Dispatch<SetStateAction<T>>;

const open: string[] = [];
const setOpen: Setter<string[]> = () => {};
const sections: ("a" | "b")[] = [];
const setSections: Setter<("a" | "b")[]> = () => {};
const setNumbers: Setter<number[]> = () => {};

describe("Accordion.Root types", () => {
  it("takes a typed useState setter as onValueChange", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>(["a"]);
      return (
        <Accordion.Root value={value} onValueChange={setValue}>
          <Accordion.Item value="a">
            <Accordion.Header>
              <Accordion.Trigger>A</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>Content A</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole("button", { name: "A" });
    expect(trigger).toHaveAttribute("data-panel-open");
    await user.click(trigger);
    expect(trigger).not.toHaveAttribute("data-panel-open");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-panel-open");
  });

  it("infers the item type from value or defaultValue", () => {
    typeChecks(
      <Accordion.Root value={open} onValueChange={setOpen} />,
      <Accordion.Root defaultValue={open} onValueChange={setOpen} />,
      <Accordion.Root value={sections} onValueChange={setSections} />,
      <Accordion.Root
        value={sections}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<("a" | "b")[]>()}
      />,
      // The inline callback gives Value no candidate of its own, so only defaultValue pins it
      <Accordion.Root
        defaultValue={sections}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<("a" | "b")[]>()}
      />,
    );
    expectTypeOf<AccordionRootProps<"a" | "b">["value"]>().toEqualTypeOf<
      ("a" | "b")[] | undefined
    >();
  });

  it("keeps a literal default widened", () => {
    typeChecks(
      <Accordion.Root
        defaultValue={["item-1"]}
        onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<string[]>()}
      />,
    );
  });

  it("rejects a setter of another item type", () => {
    typeChecks(
      // @ts-expect-error the items are strings, so the setter cannot take numbers
      <Accordion.Root value={open} onValueChange={setNumbers} />,
    );
  });

  it("keeps unknown[] without a value, as before", () => {
    typeChecks(
      <Accordion.Root onValueChange={(next) => expectTypeOf(next).toEqualTypeOf<unknown[]>()} />,
    );
    expectTypeOf<AccordionRootProps>().toEqualTypeOf<ComponentProps<typeof BaseAccordion.Root>>();
  });
});
