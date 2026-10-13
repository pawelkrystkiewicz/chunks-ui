import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BASES,
  buildCss,
  chartList,
  contrast,
  DEFAULT_THEME,
  loadTheme,
  type Mode,
  type Oklch,
  PRESETS,
  PRIMARIES,
  palette,
  previewColumnWidth,
  sameTheme,
  type Theme,
  toScopeStyle,
  withHue,
} from "./theme-model";

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

describe("withHue", () => {
  const primaryText = (primary: Oklch, base: Theme["base"]) => {
    const pal = palette({ ...DEFAULT_THEME, primary, base }, "light");
    const fg = pal["primary-foreground"] ?? "";
    return { fg, ratio: contrast(parseOklch(fg), parseOklch(pal.primary ?? "")) };
  };

  it("leaves Ink at today's Blue lightness and chroma", () => {
    expect(withHue(ink.primary, 200)).toEqual({ l: 0.56, c: 0.2165, h: 200 });
  });

  it("darkens a hue where neither text reaches 4.5:1 at Blue's lightness until white text does", () => {
    const primary = withHue(ink.primary, 100);
    expect(primary).toEqual({ l: 0.552, c: 0.2165, h: 100 });
    expect(primaryText(primary, "neutral").fg).toBe("oklch(0.985 0 0)");
  });

  it("gives every hue a primary whose text reaches 4.5:1 as painted, on every base", () => {
    for (let h = 0; h < 360; h++) {
      for (const { id: base } of BASES) {
        expect(
          primaryText(withHue(ink.primary, h), base).ratio,
          `h ${h} ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps Blue as it is", () => {
    const blue = { l: 0.56, c: 0.2165, h: 257.21 };
    expect(withHue(blue, blue.h)).toEqual(blue);
  });

  it("keeps the lightness and chroma of a swatch other than Blue", () => {
    expect(withHue({ l: 0.63, c: 0.22, h: 354 }, 10)).toEqual({ l: 0.63, c: 0.22, h: 10 });
  });
});

describe("presets", () => {
  it("matches the default theme by sameTheme in either mode", () => {
    const dark: Theme = { ...DEFAULT_THEME, mode: "dark" };
    const chunks = PRESETS[0]?.theme;
    expect(chunks && sameTheme(dark, chunks)).toBe(true);
  });
});

describe("toScopeStyle", () => {
  it("gives preview cards no shadow by default, like Card.Root", () => {
    const style = toScopeStyle(DEFAULT_THEME) as Record<string, string>;
    // A transparent zero shadow, not `none`: Tailwind puts the value in a comma-separated
    // `box-shadow` list, and `none` there makes the whole declaration invalid.
    expect(style["--preview-shadow"]).toBe("0 0 #0000");
  });

  it.each([
    "--colored-text-lightness",
    "--success-border-lightness",
    "--warning-border-lightness",
    "--ring",
  ])("sets %s for the preview's mode, as theme.css does for the page's", (name) => {
    // theme.css clamps the lightness of text-primary-text and co., and of the outlined success
    // and warning borders, on :root (light) and .dark. The scope must set its own, or a light
    // preview on a dark page gets the dark-mode shades. Likewise `--ring`, which resolves the
    // primary where it is declared.
    const token = name.slice(2);
    const scoped = (mode: Mode) =>
      (toScopeStyle({ ...DEFAULT_THEME, mode }) as Record<string, string>)[name];
    expect(themeTokens(":root")[token]).toBeDefined();
    expect(themeTokens(".dark")[token]).toBeDefined();
    expect(scoped("light")).toBe(themeTokens(":root")[token]);
    expect(scoped("dark")).toBe(themeTokens(".dark")[token]);
  });

  it("writes px tokens and scales text by base size", () => {
    const style = toScopeStyle({ ...DEFAULT_THEME, fontSize: 16, spacing: 1.1 }) as Record<
      string,
      string
    >;
    expect(style["--radius"]).toBe("10px");
    expect(style["--spacing"]).toBe("4.4px");
    expect(style["--text-sm"]).toBe("16px");
    expect(style["--text-xs"]).toBe("13.7143px");
  });
});

describe("previewColumnWidth", () => {
  it("fits the Calendar card at default tokens", () => {
    expect(previewColumnWidth(DEFAULT_THEME)).toBe(286);
  });

  it("keeps three default columns in the 979px preview of a 1440px window", () => {
    const gap = 20; // gap-5 at default spacing
    expect(3 * previewColumnWidth(DEFAULT_THEME) + 2 * gap).toBeLessThanOrEqual(979);
  });

  it("grows with Spacing and with Base size, following the larger of the two", () => {
    expect(previewColumnWidth({ spacing: 1.25, fontSize: 14 })).toBe(357);
    expect(previewColumnWidth({ spacing: 1, fontSize: 17 })).toBe(347);
    expect(previewColumnWidth({ spacing: 1.25, fontSize: 17 })).toBe(357);
    expect(previewColumnWidth({ spacing: 1.2, fontSize: 17 })).toBe(347);
  });

  it("shrinks when both knobs go below their defaults", () => {
    expect(previewColumnWidth({ spacing: 0.75, fontSize: 12 })).toBe(246);
  });

  it("ignores control height", () => {
    const tall: Theme = { ...DEFAULT_THEME, height: 44 };
    expect(previewColumnWidth(tall)).toBe(286);
  });
});

describe("buildCss", () => {
  it("exports light and dark blocks with the library's default values", () => {
    const css = buildCss(DEFAULT_THEME);
    expect(css.split("\n")[0]).toBe(
      "/* Fonts: https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap */",
    );
    expect(css).toContain("\n:root {\n  --font-sans: 'Manrope'");
    expect(css).toContain("\n  --font-heading: 'Outfit'");
    expect(css).toContain("  --text-sm: 0.875rem;\n");
    expect(css).toContain(
      "  --radius: 0.625rem;\n  --spacing: 0.25rem;\n  --spacing-ui-height: 35px;\n",
    );
    expect(css).toContain("\n}\n\n.dark {\n  --primary: oklch(0.56 0.2165 257.21);");
    // Both blocks declare their own `--ring`.
    expect(css.split(`\n  --ring: ${themeTokens(":root").ring};\n`)).toHaveLength(3);
  });

  it("leaves the coloured-text tokens out", () => {
    // Pasted on :root, `--X-text` would resolve against the root's `--X`; theme.css derives them where used.
    expect(buildCss(DEFAULT_THEME)).not.toContain("-text:");
  });

  it("names both fonts when heading and body differ", () => {
    const css = buildCss({ ...DEFAULT_THEME, fontHeading: "Newsreader", fontBody: "DM Sans" });
    expect(css.split("\n")[0]).toBe(
      "/* Fonts: https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Newsreader:wght@400;500;600;700&display=swap */",
    );
  });
});

describe("loadTheme", () => {
  const stored = (value: unknown) =>
    vi.stubGlobal("localStorage", {
      getItem: () => (typeof value === "string" ? value : JSON.stringify(value)),
    });

  afterEach(() => vi.unstubAllGlobals());

  it("returns null when nothing usable is stored", () => {
    stored(null);
    expect(loadTheme()).toBeNull();
    stored("not json");
    expect(loadTheme()).toBeNull();
  });

  it("keeps a valid stored theme", () => {
    const t = { ...DEFAULT_THEME, radius: 4, base: "zinc", primary: { l: 0.5, c: 0.1, h: 20 } };
    stored(t);
    expect(loadTheme()).toEqual(t);
  });

  it("falls back to defaults for fields of the wrong type", () => {
    stored({
      ...DEFAULT_THEME,
      radius: "wide",
      fontBody: 3,
      primary: { l: 0.5, c: "x", h: 1 },
      extra: 1,
    });
    expect(loadTheme()).toEqual(DEFAULT_THEME);
  });

  it("falls back to defaults for values outside the allowed sets", () => {
    for (const bad of [{ shadow: "x" }, { mode: "x" }, { base: "x" }, { chart: "x" }]) {
      stored({ ...DEFAULT_THEME, ...bad });
      const t = loadTheme() as Theme;
      expect(t).toEqual(DEFAULT_THEME);
      expect(() => toScopeStyle(t)).not.toThrow();
    }
  });

  it("clamps out-of-range numbers and rejects non-finite ones", () => {
    stored({ ...DEFAULT_THEME, fontSize: 99, radius: -5, height: 1, spacing: 9 });
    expect(loadTheme()).toMatchObject({ fontSize: 17, radius: 0, height: 28, spacing: 1.25 });
    stored('{"fontSize":1e999,"radius":null,"primary":{"l":1e999,"c":0,"h":0}}');
    expect(loadTheme()).toEqual(DEFAULT_THEME);
  });

  it("loads a stored old Blue as the current Blue, so the Blue swatch is selected", () => {
    // Blue's lightness before #214 deepened it to 0.56
    stored({ ...DEFAULT_THEME, radius: 4, primary: { l: 0.6048, c: 0.2165, h: 257.21 } });
    expect(loadTheme()).toEqual({
      ...DEFAULT_THEME,
      radius: 4,
      primary: { l: 0.56, c: 0.2165, h: 257.21 },
    });
  });

  it("loads any other stored primary unchanged", () => {
    for (const primary of [
      { l: 0.6048, c: 0.2165, h: 200 }, // the old Blue's lightness at another hue
      { l: 0.6048, c: 0.2165, h: 257 }, // what the hue slider built on leaving Ink until #294
    ]) {
      stored({ ...DEFAULT_THEME, primary });
      expect(loadTheme()?.primary).toEqual(primary);
    }
  });
});
