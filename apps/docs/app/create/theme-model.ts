import type { CSSProperties } from "react";
import { isLayoutFont } from "../layout-fonts";
import {
  BASES,
  BLUE,
  baseOf,
  contrast,
  DEFAULT_THEME,
  type Mode,
  type Oklch,
  type Overrides,
  ok,
  PRIMARIES,
  palette,
  type Shadow,
  type Theme,
} from "./palette";

export type { BaseId, ChartId, Mode, Oklch, Overrides, Shadow, Theme } from "./palette";
export { BASES, chartList, contrast, DEFAULT_THEME, ok, PRIMARIES, palette } from "./palette";

export type FontKind = "Sans" | "Grotesk" | "Serif" | "Mono";
export type Font = { name: string; kind: FontKind; stack: string };

const sans = (name: string) => `'${name}', ui-sans-serif, system-ui, sans-serif`;

export const FONTS: Font[] = [
  { name: "Manrope", kind: "Sans", stack: sans("Manrope") },
  { name: "Geist", kind: "Sans", stack: sans("Geist") },
  { name: "DM Sans", kind: "Sans", stack: sans("DM Sans") },
  { name: "IBM Plex Sans", kind: "Sans", stack: sans("IBM Plex Sans") },
  { name: "Plus Jakarta Sans", kind: "Sans", stack: sans("Plus Jakarta Sans") },
  { name: "Figtree", kind: "Sans", stack: sans("Figtree") },
  { name: "Outfit", kind: "Sans", stack: sans("Outfit") },
  { name: "Space Grotesk", kind: "Grotesk", stack: sans("Space Grotesk") },
  { name: "Newsreader", kind: "Serif", stack: "'Newsreader', ui-serif, Georgia, serif" },
  { name: "Fira Code", kind: "Mono", stack: "'Fira Code', ui-monospace, monospace" },
];

export const fontOf = (name: string): Font =>
  FONTS.find((f) => f.name === name) ?? (FONTS[0] as Font);

/** Skips families the docs layout already loads; its weight ranges cover 400-700. */
export const FONTS_HREF = `https://fonts.googleapis.com/css2?${FONTS.filter(
  (f) => !isLayoutFont(f.name),
)
  .map((f) => `family=${f.name.replaceAll(" ", "+")}:wght@400;500;600;700`)
  .join("&")}&display=swap`;

/** Presets never carry `mode`: applying one keeps the current light/dark choice. */
export const PRESETS: { name: string; theme: Omit<Theme, "mode"> }[] = [
  { name: "Chunks", theme: (({ mode: _, ...t }) => t)(DEFAULT_THEME) },
  {
    name: "Graphite",
    theme: {
      primary: { l: 0.205, c: 0, h: 0 },
      base: "zinc",
      fontHeading: "Geist",
      fontBody: "Geist",
      fontSize: 14,
      radius: 8,
      height: 36,
      spacing: 1,
      shadow: "none",
      chart: "mono",
    },
  },
  {
    name: "Ocean",
    theme: {
      primary: { l: 0.66, c: 0.14, h: 230 },
      base: "slate",
      fontHeading: "Plus Jakarta Sans",
      fontBody: "Plus Jakarta Sans",
      fontSize: 14,
      radius: 12,
      height: 38,
      spacing: 1.05,
      shadow: "subtle",
      chart: "vivid",
    },
  },
  {
    name: "Editorial",
    theme: {
      primary: { l: 0.63, c: 0.17, h: 150 },
      base: "stone",
      fontHeading: "Newsreader",
      fontBody: "DM Sans",
      fontSize: 15,
      radius: 6,
      height: 36,
      spacing: 1,
      shadow: "none",
      chart: "mono",
    },
  },
  {
    name: "Rose",
    theme: {
      primary: { l: 0.63, c: 0.22, h: 354 },
      base: "mauve",
      fontHeading: "Outfit",
      fontBody: "Outfit",
      fontSize: 14,
      radius: 16,
      height: 38,
      spacing: 1.1,
      shadow: "lifted",
      chart: "vivid",
    },
  },
  {
    name: "Brutal",
    theme: {
      primary: { l: 0.68, c: 0.19, h: 45 },
      base: "neutral",
      fontHeading: "Space Grotesk",
      fontBody: "Space Grotesk",
      fontSize: 14,
      radius: 0,
      height: 40,
      spacing: 1,
      shadow: "none",
      chart: "default",
    },
  },
];

export const RADIUS_STOPS = [0, 4, 6, 10, 14, 20];

/**
 * The primary the hue slider makes when it moves `p` to hue `h`. Ink and Blue-chroma primaries
 * (Blue, or one the slider made) start from Blue's lightness and chroma every time, so moves
 * never ratchet the lightness down. Where white text can't reach 4.5:1 there, and dark text
 * misses 4.5:1 on at least one base, it darkens in 0.001 steps until white text does. Other swatches keep theirs.
 */
export function withHue(p: Oklch, h: number): Oklch {
  if (p.c >= 0.01 && p.c !== BLUE.c) return { l: p.l, c: p.c, h };
  const at = (l: number) => ({ l, c: BLUE.c, h });
  let l = BLUE.l;
  if (BASES.some((b) => contrast({ l: 0.145, c: b.c, h: b.h }, at(l)) < 4.5)) {
    while (contrast({ l: 0.985, c: 0, h: 0 }, at(l)) < 4.5) l = (Math.round(l * 1000) - 1) / 1000;
  }
  return at(l);
}

const SHADOWS: Record<Shadow, (dark: boolean) => string> = {
  none: () => "0 0 #0000",
  subtle: (d) => (d ? "0 1px 2px 0 oklch(0 0 0 / 0.4)" : "0 1px 2px 0 oklch(0 0 0 / 0.05)"),
  lifted: (d) =>
    d
      ? "0 8px 24px -6px oklch(0 0 0 / 0.6), 0 1px 3px oklch(0 0 0 / 0.4)"
      : "0 8px 24px -8px oklch(0 0 0 / 0.12), 0 1px 3px oklch(0 0 0 / 0.06)",
};

/** Tailwind's default `--text-*` sizes in px; "Base size" scales them by `fontSize / 14`. */
export const TEXT_STEPS = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24 };

const textVars = (fontSize: number, unit: "px" | "rem") =>
  Object.entries(TEXT_STEPS).map(([k, px]) => {
    const v = (px * fontSize) / 14 / (unit === "rem" ? 16 : 1);
    return [`--text-${k}`, `${+v.toFixed(4)}${unit}`] as const;
  });

/** Everything the preview scope needs, as an inline style. Never touches `<html>`. */
export function toScopeStyle(t: Theme): CSSProperties {
  const dark = t.mode === "dark";
  const b = baseOf(t.base);
  const vars = {
    ...Object.fromEntries(Object.entries(palette(t, t.mode)).map(([k, v]) => [`--${k}`, v])),
    ...Object.fromEntries(textVars(t.fontSize, "px")),
    // theme.css sets these on :root and .dark, so without them the page's mode would pick the
    // preview's text-primary-text shades and outlined borders (too light in a light preview on a
    // dark page)
    "--colored-text-lightness": dark ? "max(l, 0.63)" : "min(l, 0.51)",
    "--success-border-lightness": dark ? "l" : "min(l, 0.64)",
    "--warning-border-lightness": dark ? "l" : "min(l, 0.67)",
    "--canvas": ok(dark ? 0.105 : 0.975, b.c, b.h),
    "--radius": `${t.radius}px`,
    "--spacing": `${4 * t.spacing}px`,
    "--spacing-ui-height": `${t.height}px`,
    "--font-sans": fontOf(t.fontBody).stack,
    "--font-heading": fontOf(t.fontHeading).stack,
    "--preview-shadow": SHADOWS[t.shadow](dark),
  };
  return {
    ...vars,
    fontFamily: "var(--font-sans)",
    fontSize: `${t.fontSize}px`,
    color: "var(--foreground)",
    colorScheme: t.mode,
  } as CSSProperties;
}

/**
 * Minimum masonry column width in px. The widest card at default tokens is the
 * Calendar: a grid and side padding of 71 spacing units (284px) plus a 2px
 * border; Tabs come next at 277px. Padding, gaps and the grid grow with Spacing;
 * labels grow with Base size. The column follows whichever knob is further above
 * its default, so the masonry drops a column instead of letting a card overflow.
 */
export const previewColumnWidth = (t: Pick<Theme, "spacing" | "fontSize">) =>
  Math.ceil(2 + 284 * Math.max(t.spacing, t.fontSize / 14));

/** The "Get code" output: paste after the `chunks-ui` import. */
export function buildCss(t: Theme): string {
  // theme.css leaves these unset, and `.dark` doesn't redeclare them, so one set in a single mode
  // would inherit into the other. `initial` is the guaranteed-invalid value: var()'s fallback applies.
  const block = (
    selector: string,
    pal: Record<string, string>,
    extra: string[],
    other: Record<string, string>,
  ) =>
    `${selector} {\n${[
      ...extra,
      ...Object.entries(pal).map(([k, v]) => `  --${k}: ${v};`),
      ...DERIVED.filter((k) => !(k in pal) && k in other).map((k) => `  --${k}: initial;`),
    ].join("\n")}\n}`;
  const light = palette(t, "light");
  const dark = palette(t, "dark");
  const fonts = [...new Set([t.fontBody, t.fontHeading])]
    .map((f) => `family=${f.replaceAll(" ", "+")}:wght@400;500;600;700`)
    .join("&");
  return `/* Fonts: https://fonts.googleapis.com/css2?${fonts}&display=swap */\n${block(
    ":root",
    light,
    [
      `  --font-sans: ${fontOf(t.fontBody).stack};`,
      `  --font-heading: ${fontOf(t.fontHeading).stack};`,
      ...textVars(t.fontSize, "rem").map(([k, v]) => `  ${k}: ${v};`),
      `  --radius: ${t.radius / 16}rem;`,
      `  --spacing: ${+(0.25 * t.spacing).toFixed(4)}rem;`,
      `  --spacing-ui-height: ${t.height}px;`,
    ],
    dark,
  )}\n\n${block(".dark", dark, [], light)}`;
}

export const samePrimary = (a: Oklch, b: Oklch) =>
  Math.abs(a.h - b.h) < 0.5 && Math.abs(a.c - b.c) < 0.005 && Math.abs(a.l - b.l) < 0.005;

/** Equality for "is this preset active". Ignores `mode`. */
export function sameTheme(a: Omit<Theme, "mode">, b: Omit<Theme, "mode">): boolean {
  const keys = [
    "base",
    "fontHeading",
    "fontBody",
    "fontSize",
    "radius",
    "height",
    "spacing",
    "shadow",
    "chart",
  ] as const;
  return (
    keys.every((k) => a[k] === b[k]) &&
    samePrimary(a.primary, b.primary) &&
    countOverrides(a.overrides) === countOverrides(b.overrides)
  );
}

/** The shades theme.css derives, unset until a hand-set colour gives them a value */
const DERIVED = [
  "primary-text",
  "success-text",
  "warning-text",
  "destructive-text",
  "success-border",
  "warning-border",
];

/** Tokens the contrast table may set by hand: every palette token, and the derived shades. */
export const EDITABLE = [...Object.keys(palette(DEFAULT_THEME, "light")), ...DERIVED];

const NEUTRALS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
];

/** The hand-set tokens a sidebar control drives, which changing it drops */
const DRIVEN: Record<"primary" | "base" | "chart", (token: string) => boolean> = {
  primary: (t) => ["primary", "primary-foreground", "primary-text", "ring"].includes(t),
  base: (t) => NEUTRALS.includes(t),
  chart: (t) => t.startsWith("chart-"),
};

export const countOverrides = (o?: Overrides) =>
  Object.values(o ?? {}).reduce((n, tokens) => n + Object.keys(tokens ?? {}).length, 0);

/** `o` with `token` set to `value` in `mode`, or removed when `value` is null */
export function withOverride(
  o: Overrides | undefined,
  mode: Mode,
  token: string,
  value: Oklch | null,
): Overrides | undefined {
  const { [token]: _, ...rest } = o?.[mode] ?? {};
  const next = { ...o, [mode]: value ? { ...rest, [token]: value } : rest };
  return countOverrides(next) ? next : undefined;
}

/**
 * Applies a change. Moving Primary, Base or Charts drops the hand-set colours that control drives;
 * a patch that sets `overrides` itself (presets, shuffle) replaces them.
 */
export function applyPatch(prev: Theme, patch: Partial<Theme>): Theme {
  const next = { ...prev, ...patch };
  if ("overrides" in patch || !prev.overrides) return next;
  // A key counts as moved only when its value changed: clicking the active swatch keeps the colours
  const changed = {
    primary: (p: Partial<Theme>) => !!p.primary && !samePrimary(prev.primary, p.primary),
    base: (p: Partial<Theme>) => "base" in p && p.base !== prev.base,
    chart: (p: Partial<Theme>) => "chart" in p && p.chart !== prev.chart,
  };
  const moved = (["primary", "base", "chart"] as const).filter((k) => changed[k](patch));
  if (moved.length === 0) return next;
  const keep = (token: string) => !moved.some((k) => DRIVEN[k](token));
  let overrides: Overrides | undefined = prev.overrides;
  for (const mode of ENUMS.mode) {
    for (const token of Object.keys(prev.overrides[mode] ?? {})) {
      if (!keep(token)) overrides = withOverride(overrides, mode, token, null);
    }
  }
  return { ...next, overrides };
}

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)] as T;

/** Random look. Keeps `mode` and `fontSize`. */
export function shuffle(): Omit<Theme, "mode" | "fontSize"> {
  const p = pick(PRIMARIES);
  const body = pick(FONTS.filter((f) => f.kind === "Sans" || f.kind === "Grotesk")).name;
  return {
    primary: {
      l: p.l,
      c: p.c,
      h: p.c ? (p.h + Math.round(Math.random() * 16 - 8) + 360) % 360 : 0,
    },
    base: pick(BASES).id,
    fontBody: body,
    fontHeading: Math.random() < 0.6 ? body : pick(FONTS.filter((f) => f.kind !== "Mono")).name,
    radius: pick(RADIUS_STOPS),
    height: pick([32, 35, 36, 38, 40]),
    spacing: pick([0.9, 1, 1.05, 1.1]),
    shadow: pick(ENUMS.shadow),
    chart: pick(ENUMS.chart),
  };
}

const STORE_KEY = "chunks-create-theme-v1";

/**
 * Blue before #214 deepened it. A theme stored with exactly it loads with today's Blue.
 * Matched exactly: until #294 the hue slider built `l: 0.6048` at integer hues, and themes
 * stored from it load as they are.
 */
const OLD_BLUE: Oklch = { l: 0.6048, c: 0.2165, h: 257.21 };

export const ENUMS = {
  mode: ["light", "dark"] as const,
  shadow: ["none", "subtle", "lifted"] as const,
  chart: ["default", "mono", "vivid"] as const,
  base: BASES.map((b) => b.id),
} satisfies Record<string, readonly string[]>;

/** The sidebar's slider ranges. */
export const RANGES = {
  fontSize: [12, 17],
  radius: [0, 20],
  height: [28, 44],
  spacing: [0.75, 1.25],
} satisfies Record<string, [number, number]>;

export function loadTheme(): Theme | null {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    if (!s || typeof s !== "object") return null;
    // Keep a stored field only when it is valid: enums must be in their allowed
    // set, numbers finite (clamped to the sidebar range), primary all-finite.
    // Anything else falls back to the default, so stale or hand-edited storage
    // can't crash the render.
    const out: Record<string, unknown> = { ...DEFAULT_THEME };
    const p = s.primary;
    if (p && ["l", "c", "h"].every((n) => Number.isFinite(p[n]))) {
      out.primary =
        p.l === OLD_BLUE.l && p.c === OLD_BLUE.c && p.h === OLD_BLUE.h
          ? { ...BLUE }
          : { l: p.l, c: p.c, h: p.h };
    }
    for (const [k, allowed] of Object.entries(ENUMS)) {
      if ((allowed as readonly string[]).includes(s[k])) out[k] = s[k];
    }
    for (const [k, [min, max]] of Object.entries(RANGES)) {
      if (Number.isFinite(s[k])) out[k] = Math.min(max, Math.max(min, s[k]));
    }
    for (const k of ["fontHeading", "fontBody"] as const) {
      if (typeof s[k] === "string") out[k] = s[k];
    }
    // Hand-set colours: known tokens with all-finite channels, clamped to what oklch() paints
    let overrides: Overrides | undefined;
    for (const mode of ENUMS.mode) {
      const tokens = s.overrides?.[mode];
      if (!tokens || typeof tokens !== "object") continue;
      for (const [token, v] of Object.entries(tokens as Record<string, Partial<Oklch>>)) {
        if (!EDITABLE.includes(token) || !v || typeof v !== "object") continue;
        const { l, c, h } = v;
        if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) continue;
        overrides = withOverride(overrides, mode, token, {
          l: Math.min(1, Math.max(0, l as number)),
          c: Math.min(0.4, Math.max(0, c as number)),
          h: (((h as number) % 360) + 360) % 360,
        });
      }
    }
    if (overrides) out.overrides = overrides;
    return out as Theme;
  } catch {
    return null;
  }
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(t));
  } catch {
    // Storage blocked (private mode, quota): the theme just won't persist.
  }
}
