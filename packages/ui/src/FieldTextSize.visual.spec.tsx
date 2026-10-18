import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Combobox } from "./components/combobox";
import { DatePicker } from "./components/date-picker";
import { Input } from "./components/input";
import { NumberField } from "./components/number-field";
import { Select } from "./components/select";
import { Textarea } from "./components/textarea";
import { withViewport } from "./VisualTest.utils";

/*
 * iOS Safari zooms the page when a field with text under 16px takes focus (#562), so `Input`,
 * `Textarea`, `NumberField.Input` and `Combobox.Input` have 16px text below the `md` breakpoint
 * (768px) and 14px from `md` up. `Select.Trigger` and the `DatePicker` trigger take the same size,
 * so a form on a phone has one text size (#580). These specs read the font size the browser
 * computes for each part, on the default 414px page (below `md`), on an 800px page (from `md` up)
 * and, for the `sm:` caveat, on a 700px page (from `sm` up to `md`), all without a touch screen.
 * jsdom loads no stylesheet, so a unit spec could only compare class strings. No screenshots are
 * taken.
 */

const plainInput = (className?: string) => <Input aria-label="Field" className={className} />;

/**
 * Each part that takes the text size through `className`, rendered with one and the name "Field".
 * The Input with an adornment gets the class as a function: a string goes on its wrapper, and
 * only a function reaches the input.
 */
const FIELDS: [field: string, ui: (className?: string) => ReactNode][] = [
  ["Input", plainInput],
  [
    "Input with an adornment",
    (className) => (
      <Input
        aria-label="Field"
        startAdornment="$"
        className={className ? () => className : undefined}
      />
    ),
  ],
  ["Textarea", (className) => <Textarea aria-label="Field" className={className} />],
  [
    "NumberField.Input",
    (className) => (
      <NumberField.Root>
        <NumberField.Input aria-label="Field" className={className} />
      </NumberField.Root>
    ),
  ],
  [
    "Combobox.Input",
    (className) => (
      <Combobox.Root>
        <Combobox.Input aria-label="Field" className={className} />
      </Combobox.Root>
    ),
  ],
  [
    "Select.Trigger",
    (className) => (
      <Select.Root>
        <Select.Trigger aria-label="Field" className={className} />
      </Select.Root>
    ),
  ],
];

/** The fields, and the `DatePicker` trigger, which takes no class: `className` goes on a wrapper */
const PARTS: typeof FIELDS = [
  ...FIELDS,
  ["DatePicker trigger", () => <DatePicker aria-label="Field" />],
];

/** Renders `ui` and returns the font size the browser computes for the part named "Field" */
function fontSizeOf(ui: ReactNode) {
  render(ui);
  return getComputedStyle(screen.getByLabelText("Field")).fontSize;
}

describe("below md, on the default 414px page", () => {
  it.each(PARTS)("%s is 16px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("16px");
  });

  it.each([
    // A `max-md:` size replaces the 16px below `md`
    ["max-md:text-lg", "18px"],
    // A `md:` size, like the larger breakpoints, leaves it alone
    ["md:text-lg", "16px"],
  ])("Input with className %s is %s", (className, size) => {
    expect(fontSizeOf(plainInput(className))).toBe(size);
  });
});

describe("from md up, on an 800px page", () => {
  withViewport(800);

  it.each(PARTS)("%s is 14px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("14px");
  });

  // A size without a prefix applies from `md` up. A row per field: a field that put `className`
  // before the shared text size in its `cn(...)` would fail only its own
  it.each(FIELDS)("%s is 18px with className text-lg", (_, ui) => {
    expect(fontSizeOf(ui("text-lg"))).toBe("18px");
  });

  it("Input is 14px with className max-md:text-lg", () => {
    expect(fontSizeOf(plainInput("max-md:text-lg"))).toBe("14px");
  });
});

describe("from sm up to md, on a 700px page", () => {
  withViewport(700);

  // shadcn's habit: 14px from `sm` up. A `sm:` size applies from 640px and, as Tailwind emits
  // every `max-*` variant before the min-width ones, wins over the 16px until `md`. Only with a
  // mouse: the touch size wins over it, so a phone or tablet keeps 16px
  it("Input is 14px with className text-base sm:text-sm", () => {
    expect(fontSizeOf(plainInput("text-base sm:text-sm"))).toBe("14px");
  });
});
