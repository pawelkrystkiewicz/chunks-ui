import { describe, expect, it } from "vitest";
import {
  buildCss,
  chartList,
  DEFAULT_THEME,
  PRESETS,
  palette,
  sameTheme,
  type Theme,
  toScopeStyle,
} from "./theme-model";

const ink: Theme = { ...DEFAULT_THEME, primary: { l: 0.205, c: 0, h: 0 } };
const amber: Theme = { ...DEFAULT_THEME, primary: { l: 0.77, c: 0.165, h: 72 } };

describe("palette", () => {
  it("matches the library defaults for the default theme", () => {
    const light = palette(DEFAULT_THEME, "light");
    expect(light.primary).toBe("oklch(0.6048 0.2165 257.21)");
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

describe("presets", () => {
  it("never carry a mode, so applying one keeps light/dark", () => {
    for (const p of PRESETS) expect(p.theme).not.toHaveProperty("mode");
  });

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

describe("buildCss", () => {
  it("exports light and dark blocks with the library's default values", () => {
    const css = buildCss(DEFAULT_THEME);
    expect(css.startsWith(":root {\n  --font-sans: 'Manrope'")).toBe(true);
    expect(css).toContain("  --text-sm: 0.875rem;\n");
    expect(css).toContain(
      "  --radius: 0.625rem;\n  --spacing: 0.25rem;\n  --spacing-ui-height: 35px;\n",
    );
    expect(css).toContain("\n}\n\n.dark {\n  --primary: oklch(0.6048 0.2165 257.21);");
    expect(css.match(/--/g)).toHaveLength(67);
  });
});
