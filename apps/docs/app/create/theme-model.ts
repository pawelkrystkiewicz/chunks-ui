import type { CSSProperties } from "react";

export type FontKind = "Sans" | "Grotesk" | "Serif" | "Mono";
export type Font = { name: string; kind: FontKind; stack: string };
type Oklch = { l: number; c: number; h: number };
export type BaseId = "neutral" | "stone" | "zinc" | "slate" | "mauve";
export type Mode = "light" | "dark";
export type Shadow = "none" | "subtle" | "lifted";
export type ChartId = "default" | "mono" | "vivid";

export type Theme = {
  primary: Oklch;
  base: BaseId;
  mode: Mode;
  fontHeading: string;
  fontBody: string;
  fontSize: number;
  radius: number;
  height: number;
  spacing: number;
  shadow: Shadow;
  chart: ChartId;
};

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

/** The docs layout already loads Manrope and Fira Code. */
export const FONTS_HREF = `https://fonts.googleapis.com/css2?${FONTS.filter(
  (f) => f.name !== "Manrope" && f.name !== "Fira Code",
)
  .map((f) => `family=${f.name.replaceAll(" ", "+")}:wght@400;500;600;700`)
  .join("&")}&display=swap`;

export const PRIMARIES: (Oklch & { name: string })[] = [
  { name: "Blue", l: 0.6048, c: 0.2165, h: 257.21 },
  { name: "Violet", l: 0.58, c: 0.22, h: 293 },
  { name: "Pink", l: 0.63, c: 0.22, h: 354 },
  { name: "Red", l: 0.6, c: 0.22, h: 25 },
  { name: "Orange", l: 0.68, c: 0.19, h: 45 },
  { name: "Amber", l: 0.77, c: 0.165, h: 72 },
  { name: "Green", l: 0.63, c: 0.17, h: 150 },
  { name: "Teal", l: 0.62, c: 0.12, h: 185 },
  { name: "Sky", l: 0.66, c: 0.14, h: 230 },
  { name: "Ink", l: 0.205, c: 0, h: 0 },
];

export const BASES: { id: BaseId; name: string; h: number; c: number }[] = [
  { id: "neutral", name: "Neutral", h: 0, c: 0 },
  { id: "stone", name: "Stone", h: 60, c: 0.006 },
  { id: "zinc", name: "Zinc", h: 286, c: 0.008 },
  { id: "slate", name: "Slate", h: 257, c: 0.018 },
  { id: "mauve", name: "Mauve", h: 320, c: 0.012 },
];

const baseOf = (id: BaseId) =>
  BASES.find((b) => b.id === id) ?? (BASES[0] as (typeof BASES)[number]);

export const DEFAULT_THEME: Theme = {
  primary: { l: 0.6048, c: 0.2165, h: 257.21 },
  base: "neutral",
  mode: "light",
  fontHeading: "Manrope",
  fontBody: "Manrope",
  fontSize: 14,
  radius: 10,
  height: 35,
  spacing: 1,
  shadow: "subtle",
  chart: "default",
};

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

export const ok = (l: number, c: number, h: number) =>
  `oklch(${+l.toFixed(4)} ${+c.toFixed(4)} ${+h.toFixed(2)})`;

/** Matches the `--chart-*` values in `chunks-ui/theme.css`. */
const DS_CHARTS = {
  light: [
    "oklch(0.646 0.222 41.116)",
    "oklch(0.6 0.118 184.704)",
    "oklch(0.398 0.07 227.392)",
    "oklch(0.828 0.189 84.429)",
    "oklch(0.769 0.188 70.08)",
  ],
  dark: [
    "oklch(0.488 0.243 264.376)",
    "oklch(0.696 0.17 162.48)",
    "oklch(0.769 0.188 70.08)",
    "oklch(0.627 0.265 303.9)",
    "oklch(0.645 0.246 16.439)",
  ],
};

export function chartList(t: Pick<Theme, "primary" | "chart">, mode: Mode): string[] {
  const p = t.primary;
  const dark = mode === "dark";
  if (t.chart === "mono") {
    const c = p.c < 0.01 ? 0 : Math.min(p.c, 0.18);
    return (dark ? [0.82, 0.72, 0.62, 0.52, 0.42] : [0.45, 0.6, 0.72, 0.82, 0.9]).map((l) =>
      ok(l, c, p.h),
    );
  }
  if (t.chart === "vivid") {
    const h0 = p.c < 0.01 ? 257 : p.h;
    return [0, 72, 144, 216, 288].map((o) => ok(0.68, 0.17, (h0 + o) % 360));
  }
  return DS_CHARTS[mode];
}

export function palette(t: Theme, mode: Mode): Record<string, string> {
  const b = baseOf(t.base);
  const n = (l: number, k = 1) => ok(l, b.c * k, b.h);
  const d = mode === "dark";
  const p = t.primary;
  const ink = p.c < 0.01;
  const out: Record<string, string> = {
    primary: ink ? (d ? n(0.922) : n(0.205)) : ok(p.l, p.c, p.h),
    "primary-foreground": ink
      ? d
        ? n(0.205)
        : n(0.985)
      : p.l > 0.72
        ? n(0.145)
        : "oklch(0.985 0 0)",
    success: "oklch(75.14% 0.1514 166.5)",
    "success-foreground": "oklch(0.985 0 0)",
    warning: "oklch(77.97% 0.1665 72.45)",
    "warning-foreground": "oklch(0.145 0 0)",
    destructive: "oklch(66.16% 0.2249 25.88)",
    "destructive-foreground": "oklch(0.985 0 0)",
    background: d ? n(0.145) : "oklch(1 0 0)",
    foreground: d ? n(0.985) : n(0.145),
    card: d ? n(0.145) : "oklch(1 0 0)",
    "card-foreground": d ? n(0.985) : n(0.145),
    popover: d ? n(0.145) : "oklch(1 0 0)",
    "popover-foreground": d ? n(0.985) : n(0.145),
    secondary: d ? n(0.269) : n(0.97),
    "secondary-foreground": d ? n(0.985) : n(0.205),
    muted: d ? n(0.269) : n(0.97),
    "muted-foreground": d ? n(0.708, 2) : n(0.556, 2),
    accent: d ? n(0.269) : n(0.97),
    "accent-foreground": d ? n(0.985) : n(0.205),
    border: d ? n(0.269) : n(0.922),
    input: d ? n(0.3) : n(0.922),
    ring: d ? n(0.556) : n(0.708),
  };
  chartList(t, mode).forEach((v, i) => {
    out[`chart-${i + 1}`] = v;
  });
  return out;
}

const SHADOWS: Record<Shadow, (dark: boolean) => string> = {
  none: () => "none",
  subtle: (d) => (d ? "0 1px 2px 0 oklch(0 0 0 / 0.4)" : "0 1px 2px 0 oklch(0 0 0 / 0.05)"),
  lifted: (d) =>
    d
      ? "0 8px 24px -6px oklch(0 0 0 / 0.6), 0 1px 3px oklch(0 0 0 / 0.4)"
      : "0 8px 24px -8px oklch(0 0 0 / 0.12), 0 1px 3px oklch(0 0 0 / 0.06)",
};

/** Tailwind's default `--text-*` sizes in px; "Base size" scales them by `fontSize / 14`. */
const TEXT_STEPS = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24 };

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
 * Calendar: a fixed grid of 79 spacing units (316px) plus a 2px border. Padding,
 * gaps and that grid grow with Spacing; text grows with Base size. The column
 * follows whichever knob is further above its default, so the masonry drops a
 * column instead of letting a card overflow.
 */
export const previewColumnWidth = (t: Pick<Theme, "spacing" | "fontSize">) =>
  Math.ceil(2 + 316 * Math.max(t.spacing, t.fontSize / 14));

/** The "Get code" output: paste after the `chunks-ui` import. */
export function buildCss(t: Theme): string {
  const block = (selector: string, pal: Record<string, string>, extra: string[]) =>
    `${selector} {\n${[...extra, ...Object.entries(pal).map(([k, v]) => `  --${k}: ${v};`)].join("\n")}\n}`;
  const fonts = [...new Set([t.fontBody, t.fontHeading])]
    .map((f) => `family=${f.replaceAll(" ", "+")}:wght@400;500;600;700`)
    .join("&");
  return `/* Fonts: https://fonts.googleapis.com/css2?${fonts}&display=swap */\n${block(
    ":root",
    palette(t, "light"),
    [
      `  --font-sans: ${fontOf(t.fontBody).stack};`,
      `  --font-heading: ${fontOf(t.fontHeading).stack};`,
      ...textVars(t.fontSize, "rem").map(([k, v]) => `  ${k}: ${v};`),
      `  --radius: ${t.radius / 16}rem;`,
      `  --spacing: ${+(0.25 * t.spacing).toFixed(4)}rem;`,
      `  --spacing-ui-height: ${t.height}px;`,
    ],
  )}\n\n${block(".dark", palette(t, "dark"), [])}`;
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
  return keys.every((k) => a[k] === b[k]) && samePrimary(a.primary, b.primary);
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
      out.primary = { l: p.l, c: p.c, h: p.h };
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
