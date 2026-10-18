import { describe, expect, it } from "vitest";
import { fontSizeOf, PARTS, plainInput } from "./FieldTextSize.fixtures";
import { withViewport } from "./VisualTest.utils";

/*
 * A touch screen (`pointer: coarse`) gets 16px field text at any width (#580): an iPad, or a large
 * iPhone held sideways, is wider than `md` and iOS Safari zooms into 14px text there too. The
 * `chromium-touch` project runs this file on a page with a touch screen; see
 * vitest.visual.config.ts. No screenshots are taken.
 */

it("runs with a touch screen", () => {
  expect(matchMedia("(pointer: coarse)").matches).toBe(true);
});

describe("on the default 414px page", () => {
  // A phone has a touch screen, so a `max-md:` size gives way to the touch size there too
  it("Input is 16px with className max-md:text-lg", () => {
    expect(fontSizeOf(plainInput("max-md:text-lg"))).toBe("16px");
  });
});

describe("on a 700px page", () => {
  withViewport(700);

  // With a mouse, `sm:text-sm` brings 14px back from 640px; on a touch screen the 16px stays
  it("Input is 16px with className text-base sm:text-sm", () => {
    expect(fontSizeOf(plainInput("text-base sm:text-sm"))).toBe("16px");
  });
});

describe("on a 1024px page", () => {
  withViewport(1024);

  it.each(PARTS)("%s is 16px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("16px");
  });

  // The touch size wins over an unprefixed or breakpoint size, and over `pointer-coarse:`, which
  // tailwind-merge does not treat as the same class
  it.each(["text-lg", "md:text-lg", "pointer-coarse:text-lg"])(
    "Input is 16px with className %s",
    (className) => {
      expect(fontSizeOf(plainInput(className))).toBe("16px");
    },
  );

  // The documented override: a size with the same variant replaces the touch size
  it("Input is 18px with className [@media(pointer:coarse)]:text-lg", () => {
    expect(fontSizeOf(plainInput("[@media(pointer:coarse)]:text-lg"))).toBe("18px");
  });
});
