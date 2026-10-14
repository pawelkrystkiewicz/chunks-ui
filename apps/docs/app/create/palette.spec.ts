import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BASES, chartList, contrast, type Mode, type Oklch, palette, type Theme } from "./palette";
import { DEFAULT_THEME, PRIMARIES } from "./theme-model";

/** Reads an `oklch(l c h)` string as written by `palette()` or theme.css, whose lightness may be a percentage. */
function parseOklch(value: string): Oklch {
  const parts = /^oklch\(([\d.]+)(%?) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!parts) throw new Error(`Not an oklch() colour: ${value}`);
  const [, l = "", percent, c = "", h = ""] = parts;
  return { l: Number(l) / (percent ? 100 : 1), c: Number(c), h: Number(h) };
}

const themeCss = readFileSync(
  new URL("../../../../packages/ui/src/theme.css", import.meta.url),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** The `--name: value` declarations of one top-level block of theme.css, without the `--`. */
function themeTokens(selector: ":root" | ".dark"): Record<string, string> {
  const escaped = selector.replace(".", "\\.");
  const blocks = [...themeCss.matchAll(new RegExp(`^${escaped} \\{([^}]*)\\}`, "gm"))];
  if (blocks.length !== 1) {
    throw new Error(
      `Expected one top-level ${selector} block in theme.css, found ${blocks.length}`,
    );
  }
  const body = blocks[0]?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/--([\w-]+): ([^;]+);/g)].map(([, k, v]) => [k, v]));
}

const ink: Theme = { ...DEFAULT_THEME, primary: { l: 0.205, c: 0, h: 0 } };
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

  it("measures the colours as painted, in 8-bit sRGB", () => {
    // Paints as #757900. Unrounded, white text on it measures 4.50:1.
    expect(contrast({ l: 0.985, c: 0, h: 0 }, { l: 0.546, c: 0.2165, h: 113 })).toBeCloseTo(
      4.48,
      2,
    );
  });
});
