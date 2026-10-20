import { describe, expect, it } from "vitest";
import { cssVarName, formatCssValue, parseSize } from "./size";

describe("parseSize", () => {
  it("reads a number as px", () => {
    expect(parseSize(240)).toEqual({ value: 240, unit: "px" });
  });

  it("reads px and % strings, fractions included", () => {
    expect(parseSize("240px")).toEqual({ value: 240, unit: "px" });
    expect(parseSize("33.5%")).toEqual({ value: 33.5, unit: "%" });
    expect(parseSize(" 20 % ")).toEqual({ value: 20, unit: "%" });
    expect(parseSize(".5%")).toEqual({ value: 0.5, unit: "%" });
  });

  it("reads a bare numeric string as px", () => {
    expect(parseSize("12")).toEqual({ value: 12, unit: "px" });
  });

  it("refuses anything else", () => {
    for (const bad of [
      undefined,
      null,
      -1,
      Number.NaN,
      Infinity,
      "",
      "abc",
      "10em",
      "-5%",
      {},
      [],
    ]) {
      expect(parseSize(bad)).toBeUndefined();
    }
  });
});

describe("cssVarName", () => {
  it("keeps a safe id", () => {
    expect(cssVarName("side-bar1")).toBe("--resizable-side-bar1");
  });

  it("escapes unsafe characters without colliding", () => {
    expect(cssVarName("a.b")).not.toBe(cssVarName("a_b"));
    expect(cssVarName("a b")).toMatch(/^--resizable-[\w-]+$/);
    // `a.b` escapes to `a_2e_b`, which is itself a valid id and must not collide with it
    expect(cssVarName("a.b")).not.toBe(cssVarName("a_2e_b"));
  });
});

describe("formatCssValue", () => {
  it("writes px with a unit and % as a bare share", () => {
    expect(formatCssValue(240, "px")).toBe("240px");
    expect(formatCssValue(30, "%")).toBe("30");
  });
});
