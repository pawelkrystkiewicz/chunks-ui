import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Combobox } from "./components/combobox";
import { Input, type InputProps } from "./components/input";
import { NumberField } from "./components/number-field";
import { Textarea } from "./components/textarea";
import { withViewport } from "./VisualTest.utils";

/*
 * iOS Safari zooms the page when a field with text under 16px takes focus (#562), so `Input`,
 * `Textarea`, `NumberField.Input` and `Combobox.Input` have 16px text below the `md` breakpoint
 * (768px) and 14px from `md` up. These specs read the font size the browser computes for each
 * field, on the default 414px page (below `md`) and on an 800px page (from `md` up). jsdom loads
 * no stylesheet, so a unit spec could only compare class strings. No screenshots are taken.
 */

/** A `className` for a field, and the font size the field has with it at each width */
const CLASSES = [
  { given: "no className", className: undefined, belowMd: "16px", fromMd: "14px" },
  // A size without a prefix applies from `md` up, and the field stays 16px below it
  { given: "className text-lg", className: "text-lg", belowMd: "16px", fromMd: "18px" },
  // A `max-md:` size replaces the 16px below `md`
  {
    given: "className max-md:text-lg",
    className: "max-md:text-lg",
    belowMd: "18px",
    fromMd: "14px",
  },
] as const;

/** Each field, rendered with a `className` and the name "Field" */
const FIELDS: { field: string; ui: (className?: string) => ReactNode }[] = [
  { field: "Input", ui: (className) => <Input aria-label="Field" className={className} /> },
  { field: "Textarea", ui: (className) => <Textarea aria-label="Field" className={className} /> },
  {
    field: "NumberField.Input",
    ui: (className) => (
      <NumberField.Root>
        <NumberField.Input aria-label="Field" className={className} />
      </NumberField.Root>
    ),
  },
  {
    field: "Combobox.Input",
    ui: (className) => (
      <Combobox.Root>
        <Combobox.Input aria-label="Field" className={className} />
      </Combobox.Root>
    ),
  },
];

/**
 * The same `className` on an `Input` with an adornment: a string goes on the wrapper that
 * positions the adornments, so the input keeps its size, and a function reaches the input.
 */
const ADORNED: {
  given: string;
  className: InputProps["className"];
  belowMd: string;
  fromMd: string;
}[] = [
  { given: "a string className", className: "max-md:text-lg", belowMd: "16px", fromMd: "14px" },
  {
    given: "a function className",
    className: () => "max-md:text-lg",
    belowMd: "18px",
    fromMd: "14px",
  },
];

const adorned = (className?: InputProps["className"]) => (
  <Input aria-label="Field" startAdornment="$" className={className} />
);

/** Renders `ui` and returns the font size the browser computes for the field named "Field" */
function fontSizeOf(ui: ReactNode) {
  render(ui);
  return getComputedStyle(screen.getByLabelText("Field")).fontSize;
}

/** Defines a spec per field and `className` for the page the calling `describe` sets */
function expectFontSizesAt(width: "belowMd" | "fromMd") {
  for (const { field, ui } of FIELDS) {
    describe(field, () => {
      for (const { given, className, ...sizes } of CLASSES) {
        it(`is ${sizes[width]} with ${given}`, () => {
          expect(fontSizeOf(ui(className))).toBe(sizes[width]);
        });
      }
    });
  }

  describe("Input with an adornment", () => {
    for (const { given, className, ...sizes } of ADORNED) {
      it(`is ${sizes[width]} with ${given}`, () => {
        expect(fontSizeOf(adorned(className))).toBe(sizes[width]);
      });
    }
  });
}

describe("below md, on the default 414px page", () => {
  expectFontSizesAt("belowMd");

  // Without this, the string className could be dropped and the input would still be 16px
  it("puts the string className of an Input with an adornment on the wrapper", () => {
    render(adorned("max-md:text-lg"));
    const wrapper = screen.getByLabelText("Field").closest("[data-slot=input-adornments]");
    expect(getComputedStyle(wrapper as Element).fontSize).toBe("18px");
  });
});

describe("from md up, on an 800px page", () => {
  withViewport(800);
  expectFontSizesAt("fromMd");
});
