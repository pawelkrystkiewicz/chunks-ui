import { describe, expect, it } from "vitest";
import { sanitizeLayout } from "./sanitize-layout";

const panels = [
  { id: "side", defaultSize: "30%" as const, minSize: "20%" as const, maxSize: "50%" as const },
  { id: "main", defaultSize: "70%" as const },
];

describe("sanitizeLayout", () => {
  it("keeps a valid layout", () => {
    expect(sanitizeLayout({ side: 40, main: 60 }, panels)).toEqual({ side: 40, main: 60 });
  });

  it("drops unknown ids", () => {
    expect(sanitizeLayout({ side: 40, main: 60, ghost: 9 }, panels)).toEqual({
      side: 40,
      main: 60,
    });
  });

  it("clamps to the panel's min and max in its own unit", () => {
    expect(sanitizeLayout({ side: 5, main: 95 }, panels).side).toBeLessThanOrEqual(50);
    // 5 -> 20 by min, then the shares are normalised: 20 / 115
    const low = sanitizeLayout({ side: 5, main: 80 }, panels);
    expect(low.side).toBeCloseTo((20 / 100) * 100, 5);
    expect(low.side! + low.main!).toBeCloseTo(100, 5);
  });

  it("fills missing panels from the defaults", () => {
    const layout = sanitizeLayout({ side: 40 }, panels);
    expect(layout.main).toBeCloseTo(60, 5);
    expect(layout.side! + layout.main!).toBeCloseTo(100, 5);
  });

  it("returns the defaults for input that is not a plain object", () => {
    for (const bad of [null, undefined, 3, "x", true, [], [1, 2], () => 1]) {
      expect(sanitizeLayout(bad, panels)).toEqual({ side: 30, main: 70 });
    }
  });

  it("replaces a value that is not a finite non-negative number with the default", () => {
    expect(sanitizeLayout({ side: "40", main: Number.NaN }, panels)).toEqual({
      side: 30,
      main: 70,
    });
    expect(sanitizeLayout({ side: -5, main: Infinity }, panels)).toEqual({ side: 30, main: 70 });
  });

  it("normalises % shares that do not sum to 100", () => {
    expect(sanitizeLayout({ side: 30, main: 30 }, panels)).toEqual({ side: 50, main: 50 });
  });

  it("clamps px panels and leaves them out of the normalisation", () => {
    const mixed = [
      { id: "nav", defaultSize: 240, minSize: 160, maxSize: 400 },
      { id: "a", defaultSize: "50%" as const },
      { id: "b", defaultSize: "50%" as const },
    ];
    expect(sanitizeLayout({ nav: 9999, a: 10, b: 30 }, mixed)).toEqual({ nav: 400, a: 25, b: 75 });
    expect(sanitizeLayout({ nav: 10, a: 50, b: 50 }, mixed).nav).toBe(160);
  });

  it("does not clamp against a limit in the other unit", () => {
    const cross = [{ id: "a", defaultSize: "50%" as const, minSize: 100 }, { id: "b" }];
    expect(sanitizeLayout({ a: 10, b: 90 }, cross)).toEqual({ a: 10, b: 90 });
  });

  it("returns an empty layout for no panels", () => {
    expect(sanitizeLayout({ a: 1 }, [])).toEqual({});
  });

  it("does not read inherited properties", () => {
    const raw = Object.create({ side: 40 });
    expect(sanitizeLayout(raw, panels)).toEqual({ side: 30, main: 70 });
  });
});
