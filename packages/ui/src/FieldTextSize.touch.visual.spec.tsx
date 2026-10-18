import { describe, expect, it } from "vitest";
import { fontSizeOf, PARTS, plainInput } from "./FieldTextSize.parts";
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

describe("on a 1024px page", () => {
  withViewport(1024);

  it.each(PARTS)("%s is 16px", (_, ui) => {
    expect(fontSizeOf(ui())).toBe("16px");
  });

  // The documented override: the touch size wins over an unprefixed or breakpoint size, and a
  // size with the same variant replaces it
  it("Input is 18px with className [@media(pointer:coarse)]:text-lg", () => {
    expect(fontSizeOf(plainInput("[@media(pointer:coarse)]:text-lg"))).toBe("18px");
  });
});
