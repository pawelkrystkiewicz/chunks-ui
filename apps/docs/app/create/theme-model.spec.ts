import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BASES,
  buildCss,
  chartList,
  contrast,
  DEFAULT_THEME,
  loadTheme,
  type Mode,
  PRESETS,
  PRIMARIES,
  palette,
  parseOklch,
  previewColumnWidth,
  sameTheme,
  type Theme,
  toScopeStyle,
} from "./theme-model";

const ink: Theme = { ...DEFAULT_THEME, primary: { l: 0.205, c: 0, h: 0 } };
const amber: Theme = { ...DEFAULT_THEME, primary: { l: 0.77, c: 0.165, h: 72 } };

describe("palette", () => {
  it("matches the library defaults for the default theme", () => {
    const light = palette(DEFAULT_THEME, "light");
    expect(light.primary).toBe("oklch(0.56 0.2165 257.21)");
    expect(light["primary-foreground"]).toBe("oklch(0.985 0 0)");
    expect(light.destructive).toBe("oklch(0.582 0.2249 25.88)");
    expect(light["success-foreground"]).toBe("oklch(0.145 0 0)");
    expect(light["muted-foreground"]).toBe("oklch(0.53 0 0)");
    expect(light.ring).toBe("oklch(0.62 0 0)");
    expect(light.background).toBe("oklch(1 0 0)");
    expect(light["chart-1"]).toBe("oklch(0.646 0.222 41.116)");
    expect(palette(DEFAULT_THEME, "dark").background).toBe("oklch(0.145 0 0)");
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

  it("derives coloured text from each fill, darker in light mode and lighter in dark mode", () => {
    expect(palette(DEFAULT_THEME, "light")["primary-text"]).toBe(
      "oklch(from var(--primary) min(l, 0.51) c h)",
    );
    expect(palette(DEFAULT_THEME, "dark")["destructive-text"]).toBe(
      "oklch(from var(--destructive) max(l, 0.63) c h)",
    );
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
});

describe("presets", () => {
  it("matches the default theme by sameTheme in either mode", () => {
    const dark: Theme = { ...DEFAULT_THEME, mode: "dark" };
    const chunks = PRESETS[0]?.theme;
    expect(chunks && sameTheme(dark, chunks)).toBe(true);
  });
});

describe("toScopeStyle", () => {
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
  });

  it("exports the coloured-text tokens for both modes", () => {
    const [light = "", dark = ""] = buildCss(DEFAULT_THEME).split("\n.dark {");
    for (const role of ["primary", "success", "warning", "destructive"]) {
      expect(light).toContain(`  --${role}-text: oklch(from var(--${role}) min(l, 0.51) c h);`);
      expect(dark).toContain(`  --${role}-text: oklch(from var(--${role}) max(l, 0.63) c h);`);
    }
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
});
