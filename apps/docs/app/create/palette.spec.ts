import { describe, expect, it } from "vitest";
import {
  apca,
  BASES,
  chartList,
  contrast,
  DEFAULT_THEME,
  type Mode,
  type Oklch,
  PRIMARIES,
  palette,
  parseColor,
  type Rgb,
  type Theme,
  toHex,
} from "./palette";
import { ink, parseOklch, themeTokens } from "./theme-css.test-helpers";

const amber: Theme = { ...DEFAULT_THEME, primary: { l: 0.77, c: 0.165, h: 72 } };

describe("palette", () => {
  it.each([
    ["light", ":root"],
    ["dark", ".dark"],
  ] as const)("emits theme.css's %s colour tokens for the default theme", (mode, selector) => {
    // theme.css is the source of truth. It writes some lightness as a percentage
    // (`75.14%`) and palette() as a number (`0.7514`), so the numbers are compared.
    // `--ring`, a `color-mix()` of other tokens, is compared as text. Only non-colour tokens are
    // skipped, by name, so any other colour format fails in parseOklch.
    const css = Object.fromEntries(
      Object.entries(themeTokens(selector)).filter(
        ([k]) => k !== "radius" && !k.endsWith("-lightness"),
      ),
    );
    const pal = palette(DEFAULT_THEME, mode);
    expect(Object.keys(pal).sort()).toEqual(Object.keys(css).sort());
    const close = (a: Oklch, b: Oklch) =>
      Math.abs(a.l - b.l) < 1e-4 && Math.abs(a.c - b.c) < 1e-4 && Math.abs(a.h - b.h) < 1e-2;
    const same = (a: string, b = "") =>
      a.startsWith("color-mix(") ? a === b : close(parseOklch(a), parseOklch(b));
    const drift = Object.entries(pal)
      .filter(([k, v]) => !same(v, css[k]))
      .map(([k, v]) => `--${k}: ${v} in /create, ${css[k]} in theme.css`);
    expect(drift).toEqual([]);
  });

  it("turns the Ink primary into the base neutral per mode", () => {
    expect(palette(ink, "light").primary).toBe("oklch(0.205 0 0)");
    expect(palette(ink, "dark").primary).toBe("oklch(0.922 0 0)");
  });

  it("uses a dark foreground on light primaries", () => {
    expect(palette(amber, "light")["primary-foreground"]).toBe("oklch(0.145 0 0)");
  });

  const pairs = (t: Theme, mode: Mode) => {
    const pal = palette(t, mode);
    return (["primary", "success", "warning", "destructive"] as const).map((role) => {
      const fg = pal[`${role}-foreground`] ?? "";
      return [role, contrast(parseOklch(fg), parseOklch(pal[role] ?? ""))] as const;
    });
  };

  it("gives every primary swatch and fill a foreground with at least 4.5:1", () => {
    for (const { name, ...primary } of PRIMARIES) {
      for (const { id: base } of BASES) {
        for (const mode of ["light", "dark"] as const) {
          for (const [role, ratio] of pairs({ ...DEFAULT_THEME, primary, base }, mode)) {
            expect(ratio, `${name} ${base} ${mode} ${role}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  });

  it("puts dark text on a mid-light primary that white text fails on", () => {
    const pink: Theme = { ...DEFAULT_THEME, primary: { l: 0.63, c: 0.22, h: 354 } };
    expect(palette(pink, "light")["primary-foreground"]).toBe("oklch(0.145 0 0)");
  });

  it("does not throw on a stored primary with a negative hue and picks a passing foreground", () => {
    const odd: Theme = { ...DEFAULT_THEME, primary: { l: 0.6, c: 0.2, h: -30 } };
    const pal = palette(odd, "light");
    const fg = parseOklch(pal["primary-foreground"] ?? "");
    expect(contrast(fg, odd.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it("spreads vivid charts 72° apart", () => {
    expect(chartList({ ...DEFAULT_THEME, chart: "vivid" }, "light")).toEqual([
      "oklch(0.68 0.17 257.21)",
      "oklch(0.68 0.17 329.21)",
      "oklch(0.68 0.17 41.21)",
      "oklch(0.68 0.17 113.21)",
      "oklch(0.68 0.17 185.21)",
    ]);
  });
});

describe("contrast", () => {
  it("measures WCAG 2 ratios", () => {
    expect(contrast({ l: 1, c: 0, h: 0 }, { l: 0, c: 0, h: 0 })).toBeCloseTo(21);
    expect(contrast({ l: 0.5, c: 0, h: 0 }, { l: 0.5, c: 0, h: 0 })).toBe(1);
    // #006cef under white text, as measured in the browser
    expect(contrast({ l: 0.985, c: 0, h: 0 }, parseOklch("oklch(0.56 0.2165 257.21)"))).toBeCloseTo(
      4.57,
      1,
    );
  });

  it("measures APCA Lc like the apca-w3 reference", () => {
    const white: Rgb = [255, 255, 255];
    const black: Rgb = [0, 0, 0];
    const grey: Rgb = [136, 136, 136];
    expect(apca(black, white)).toBeCloseTo(106.04, 1);
    expect(apca(white, black)).toBeCloseTo(-107.88, 1);
    expect(apca(grey, white)).toBeCloseTo(63.06, 1);
    expect(apca(white, grey)).toBeCloseTo(-68.54, 1);
    expect(apca(grey, grey)).toBe(0);
  });

  it("reads typed hex and oklch() colours, and nothing else", () => {
    // Hex round-trips through OKLCH to the same paint
    for (const hex of ["#006cef", "#888888", "#000000", "#ffffff", "#ff8800"]) {
      expect(toHex(parseColor(hex) as Oklch)).toBe(hex);
    }
    expect(parseColor("#888")).toEqual(parseColor("#888888"));
    expect(parseColor("oklch(56% 0.2 -30deg)")).toEqual({ l: 0.56, c: 0.2, h: 330 });
    for (const bad of ["red", "#12345", "oklch(2 0 0)", "oklch(0.5 0.1)", ""]) {
      expect(parseColor(bad), bad).toBeNull();
    }
  });

  it("measures the colours as painted, in 8-bit sRGB", () => {
    // Paints as #757900. Unrounded, white text on it measures 4.50:1.
    expect(contrast({ l: 0.985, c: 0, h: 0 }, { l: 0.546, c: 0.2165, h: 113 })).toBeCloseTo(
      4.48,
      2,
    );
  });
});
