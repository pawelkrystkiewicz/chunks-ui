/// <reference types="vite/client" />
import { describe, expect, expectTypeOf, it } from "vitest";
import * as main from "./index";
import * as utils from "./utils";

const sources = import.meta.glob<string>("./utils.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("chunks-ui/utils", () => {
  it("exports cn, cnState, mergeLabels, the public *Variants, springs, the element constants and the label defaults", () => {
    expect(Object.keys(utils).sort()).toEqual([
      "DEFAULT_BREADCRUMB_LABELS",
      "DEFAULT_CALENDAR_LABELS",
      "DEFAULT_CHIP_LABELS",
      "DEFAULT_CLEAR_BUTTON_LABELS",
      "DEFAULT_COMBOBOX_LABELS",
      "DEFAULT_COPY_BUTTON_LABELS",
      "DEFAULT_DATE_PICKER_LABELS",
      "DEFAULT_INPUT_COPY_LABELS",
      "DEFAULT_INPUT_LABELS",
      "DEFAULT_NUMBER_FIELD_LABELS",
      "DEFAULT_PAGINATION_LABELS",
      "DEFAULT_SLIDER_LABELS",
      "DEFAULT_THEME_TOGGLE_LABELS",
      "DEFAULT_TOAST_LABELS",
      "ELEMENT_BASE_VARIANTS",
      "ELEMENT_COLOR",
      "ELEMENT_ORIENTATION",
      "ELEMENT_PLACEMENT_HORIZONTAL",
      "ELEMENT_PLACEMENT_VERTICAL",
      "ELEMENT_POSITION",
      "ELEMENT_VARIANTS",
      "buttonVariants",
      "chipVariants",
      "cn",
      "cnState",
      "iconButtonVariants",
      "inputVariants",
      "mergeLabels",
      "sanitizeLayout",
      "springs",
    ]);
  });

  // Moving an import from "chunks-ui" to "chunks-ui/utils" must not change what it does
  it("exports nothing the main entry lacks", () => {
    for (const [name, value] of Object.entries(utils)) {
      expect((main as Record<string, unknown>)[name], name).toBe(value);
    }
  });

  // Erased at runtime: `check-types` fails if utils lacks one
  it("exports the *Labels type of every component", () => {
    expectTypeOf<utils.BreadcrumbLabels>().toEqualTypeOf<main.BreadcrumbLabels>();
    expectTypeOf<utils.CalendarLabels>().toEqualTypeOf<main.CalendarLabels>();
    expectTypeOf<utils.ChipLabels>().toEqualTypeOf<main.ChipLabels>();
    expectTypeOf<utils.ClearButtonLabels>().toEqualTypeOf<main.ClearButtonLabels>();
    expectTypeOf<utils.ComboboxLabels>().toEqualTypeOf<main.ComboboxLabels>();
    expectTypeOf<utils.CopyButtonLabels>().toEqualTypeOf<main.CopyButtonLabels>();
    expectTypeOf<utils.DatePickerLabels>().toEqualTypeOf<main.DatePickerLabels>();
    expectTypeOf<utils.InputCopyLabels>().toEqualTypeOf<main.InputCopyLabels>();
    expectTypeOf<utils.InputLabels>().toEqualTypeOf<main.InputLabels>();
    expectTypeOf<utils.NumberFieldLabels>().toEqualTypeOf<main.NumberFieldLabels>();
    expectTypeOf<utils.PaginationLabels>().toEqualTypeOf<main.PaginationLabels>();
    expectTypeOf<utils.SliderLabels>().toEqualTypeOf<main.SliderLabels>();
    expectTypeOf<utils.ThemeToggleLabels>().toEqualTypeOf<main.ThemeToggleLabels>();
    expectTypeOf<utils.ToastLabels>().toEqualTypeOf<main.ToastLabels>();
  });

  it("exports the types of the layout helpers", () => {
    expectTypeOf<utils.ResizableLayout>().toEqualTypeOf<main.ResizableLayout>();
    expectTypeOf<utils.ResizablePanelConfig>().toEqualTypeOf<main.ResizablePanelConfig>();
  });

  // tsup bundles utils.ts into dist/utils.*, which has no "use client" banner; core's
  // index.spec.ts checks that chunks-ui-core reaches no client-only package
  it("imports only chunks-ui-core", () => {
    const specifiers = [...(sources["./utils.ts"] ?? "").matchAll(/from\s+"([^"]+)"/g)].map(
      ([, s]) => s,
    );
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.filter((s) => s !== "chunks-ui-core")).toEqual([]);
  });
});
