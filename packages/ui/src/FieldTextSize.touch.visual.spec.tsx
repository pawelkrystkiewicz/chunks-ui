import { describe, expect, it } from "vitest";
import { fontSizeOf, PARTS, plainInput } from "./FieldTextSize.fixtures";
import { withViewport } from "./VisualTest.utils";

/*
 * Where touch is the primary pointer (`pointer: coarse`), field text is 16px at any width (#580):
 * below `md` through `max-md:`, as with a mouse, and from `md` up through the touch size (#587).
 * The `chromium-touch` project in vitest.visual.config.ts runs this file on a touch-screen page.
 */

it("runs with a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

// Sets 18px below `md`, and from `md` up with a mouse and on a touch screen
const EVERYWHERE = "text-lg max-md:text-lg md:[@media(pointer:coarse)]:text-lg";

describe("on the default 414px page", () => {
  it("Input is 16px", () => {
    expect(fontSizeOf(plainInput())).toBe("16px");
  });

  // A phone takes the sizes of a mouse page below `md`: a `max-md:` size replaces the 16px
  it.each(["max-md:text-lg", EVERYWHERE])("Input is 18px with className %s", (className) => {
    expect(fontSizeOf(plainInput(className))).toBe("18px");
  });
});

describe("on a 700px page", () => {
  withViewport(700);

  // The touch size starts at `md`, so `sm:text-sm` brings 14px back from 640px, as with a mouse
  it("Input is 14px with className text-base sm:text-sm", () => {
    expect(fontSizeOf(plainInput("text-base sm:text-sm"))).toBe("14px");
  });
});

describe("on a 1024px page", () => {
  withViewport(1024);

  it.each(PARTS)("%s is 16px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("16px");
  });

  // The touch size wins over an unprefixed or breakpoint size, and over a touch size without
  // `md:`: tailwind-merge keeps it beside them, and the CSS has it after them
  it.each(["text-lg", "md:text-lg", "[@media(pointer:coarse)]:text-lg", "pointer-coarse:text-lg"])(
    "Input is 16px with className %s",
    (className) => {
      expect(fontSizeOf(plainInput(className))).toBe("16px");
    },
  );

  // The documented override: a size with the same variants replaces the touch size
  it.each(["md:[@media(pointer:coarse)]:text-lg", EVERYWHERE])(
    "Input is 18px with className %s",
    (className) => {
      expect(fontSizeOf(plainInput(className))).toBe("18px");
    },
  );
});
