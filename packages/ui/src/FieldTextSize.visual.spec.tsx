import { describe, expect, it } from "vitest";
import { FIELDS, fontSizeOf, plainInput, selectItemFontSize } from "./FieldTextSize.fixtures";
import { withViewport } from "./VisualTest.utils";

/*
 * iOS Safari zooms the page when a field with text under 16px takes focus (#562), so the text
 * fields have 16px text below `md`, and `Select.Trigger` and the `DatePicker` trigger take the same
 * size so a form has one (#580), as do the items of an open `Select`, which Base UI lays over the
 * trigger's value (#587). These specs read the computed font size with a mouse;
 * `FieldTextSize.touch.visual.spec.tsx` covers a touch screen. jsdom loads no stylesheet, so a unit
 * spec could only compare class strings.
 */

describe("below md, on the default 414px page", () => {
  it.each(FIELDS)("%s is 16px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("16px");
  });

  it("an open Select's item is 16px", () => {
    expect(selectItemFontSize()).toBe("16px");
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

  it.each(FIELDS)("%s is 14px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("14px");
  });

  it("an open Select's item is 14px", () => {
    expect(selectItemFontSize()).toBe("14px");
  });

  // A size without a prefix applies from `md` up. A row per field: a field that put `className`
  // before the shared text size in its `cn(...)` would fail only its own
  it.each(FIELDS)("%s is 18px with className text-lg", (_, ui) => {
    expect(fontSizeOf(ui("text-lg"))).toBe("18px");
  });

  it("an open Select's item is 18px with className text-lg", () => {
    expect(selectItemFontSize("text-lg")).toBe("18px");
  });

  it("Input is 14px with className max-md:text-lg", () => {
    expect(fontSizeOf(plainInput("max-md:text-lg"))).toBe("14px");
  });
});

describe("from sm up to md, on a 700px page", () => {
  withViewport(700);

  // shadcn's habit: 14px from `sm` up. A `sm:` size applies from 640px and, as Tailwind emits
  // every `max-*` variant before the min-width ones, wins over the 16px until `md`, on a touch
  // screen too (the touch spec)
  it("Input is 14px with className text-base sm:text-sm", () => {
    expect(fontSizeOf(plainInput("text-base sm:text-sm"))).toBe("14px");
  });
});
