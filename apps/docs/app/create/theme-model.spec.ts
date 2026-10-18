import { afterEach, describe, expect, it, vi } from "vitest";
import { ink, parseOklch, themeTokens } from "./theme-css.test-helpers";
import {
  applyPatch,
  BASES,
  buildCss,
  contrast,
  countOverrides,
  DEFAULT_THEME,
  loadTheme,
  type Mode,
  type Oklch,
  PRESETS,
  palette,
  previewColumnWidth,
  sameTheme,
  type Theme,
  toScopeStyle,
  withHue,
  withOverride,
} from "./theme-model";

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

describe("hand-set colours", () => {
  const red: Oklch = { l: 0.5, c: 0.2, h: 25 };
  const custom: Theme = {
    ...DEFAULT_THEME,
    overrides: { light: { primary: red, muted: red, "chart-1": red, "success-text": red } },
  };

  afterEach(() => vi.unstubAllGlobals());

  it("win in palette, the preview scope and Get code, in their mode only", () => {
    expect(palette(custom, "light").muted).toBe("oklch(0.5 0.2 25)");
    expect(palette(custom, "dark").muted).toBe(palette(DEFAULT_THEME, "dark").muted);
    expect(toScopeStyle(custom)).toMatchObject({ "--success-text": "oklch(0.5 0.2 25)" });
    expect(buildCss(custom)).toContain("  --success-text: oklch(0.5 0.2 25);");
  });

  it("drop the ones a moved sidebar control drives, and keep the rest", () => {
    const moved = applyPatch(custom, { primary: { l: 0.6, c: 0.2, h: 150 } });
    expect(Object.keys(moved.overrides?.light ?? {}).sort()).toEqual([
      "chart-1",
      "muted",
      "success-text",
    ]);
    expect(applyPatch(custom, { chart: "mono" }).overrides?.light).not.toHaveProperty("chart-1");
    expect(applyPatch(custom, { base: "zinc" }).overrides?.light).not.toHaveProperty("muted");
    expect(applyPatch(custom, { mode: "dark", radius: 4 }).overrides).toEqual(custom.overrides);
    expect(applyPatch(custom, { overrides: undefined }).overrides).toBeUndefined();
  });

  it("drop chart colours when Primary moves under a chart preset that follows it", () => {
    const primary = { l: 0.6, c: 0.2, h: 150 };
    for (const chart of ["mono", "vivid"] as const) {
      const moved = applyPatch({ ...custom, chart }, { primary });
      expect(moved.overrides?.light, chart).not.toHaveProperty("chart-1");
      expect(moved.overrides?.light, chart).toHaveProperty("muted");
    }
    expect(
      applyPatch({ ...custom, chart: "default" }, { primary }).overrides?.light,
    ).toHaveProperty("chart-1");
  });

  it("keeps them when the active swatch is clicked again", () => {
    const same = applyPatch(custom, {
      primary: { ...custom.primary },
      base: custom.base,
      chart: custom.chart,
    });
    expect(same.overrides).toBe(custom.overrides);
  });

  it("writes initial for a derived token only one mode sets, so it can't leak across modes", () => {
    const light = { ...DEFAULT_THEME, overrides: { light: { "primary-text": red } } };
    const [root, dark] = buildCss(light).split("\n\n.dark");
    expect(root).toContain("--primary-text: oklch(0.5 0.2 25);");
    expect(root).not.toContain("initial");
    expect(dark).toContain("  --primary-text: initial;");
    const both = {
      ...DEFAULT_THEME,
      overrides: { light: { "primary-text": red }, dark: { "primary-text": red } },
    };
    expect(buildCss(both)).not.toContain("initial");
  });

  it("removes the last one as no overrides at all, so presets match again", () => {
    const one = withOverride(undefined, "dark", "ring", red);
    expect(countOverrides(one)).toBe(1);
    expect(withOverride(one, "dark", "ring", null)).toBeUndefined();
    expect(sameTheme(custom, DEFAULT_THEME)).toBe(false);
  });

  it("load from storage only as known tokens with finite channels, clamped", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          ...DEFAULT_THEME,
          overrides: {
            light: {
              muted: { l: 2, c: -1, h: -30 },
              "not-a-token": red,
              input: { l: 0.5, c: "x", h: 1 },
              border: "red",
            },
            dark: "nope",
            sepia: { muted: red },
          },
        }),
    });
    expect(loadTheme()?.overrides).toEqual({ light: { muted: { l: 1, c: 0, h: 330 } } });
  });
});
