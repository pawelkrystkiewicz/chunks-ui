// The /create token model and its maths, with no React, font or storage code: what
// chunks-ui-core's theme tooling can take as it is.

export type Oklch = { l: number; c: number; h: number };
/** 8-bit sRGB channels, 0-255 */
export type Rgb = [number, number, number];
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
  /** Colours set by hand in the contrast table, by mode and token name (no `--`) */
  overrides?: Overrides;
};

export type Overrides = Partial<Record<Mode, Record<string, Oklch>>>;

export const BLUE: Oklch = { l: 0.56, c: 0.2165, h: 257.21 };

/** Each one keeps 4.5:1 with its `primary-foreground`. Red sits at 0.605 so dark text reaches it. */
export const PRIMARIES: (Oklch & { name: string })[] = [
  { name: "Blue", ...BLUE },
  { name: "Violet", l: 0.58, c: 0.22, h: 293 },
  { name: "Pink", l: 0.63, c: 0.22, h: 354 },
  { name: "Red", l: 0.605, c: 0.22, h: 25 },
  { name: "Orange", l: 0.68, c: 0.19, h: 45 },
  { name: "Amber", l: 0.77, c: 0.165, h: 72 },
  { name: "Green", l: 0.63, c: 0.17, h: 150 },
  { name: "Teal", l: 0.62, c: 0.12, h: 185 },
  { name: "Sky", l: 0.66, c: 0.14, h: 230 },
  { name: "Ink", l: 0.205, c: 0, h: 0 },
];

export const DEFAULT_THEME: Theme = {
  primary: { ...BLUE },
  base: "neutral",
  mode: "light",
  fontHeading: "Outfit",
  fontBody: "Manrope",
  fontSize: 14,
  radius: 10,
  height: 35,
  spacing: 1,
  shadow: "none",
  chart: "default",
};

export const BASES: { id: BaseId; name: string; h: number; c: number }[] = [
  { id: "neutral", name: "Neutral", h: 0, c: 0 },
  { id: "stone", name: "Stone", h: 60, c: 0.006 },
  { id: "zinc", name: "Zinc", h: 286, c: 0.008 },
  { id: "slate", name: "Slate", h: 257, c: 0.018 },
  { id: "mauve", name: "Mauve", h: 320, c: 0.012 },
];

export const baseOf = (id: BaseId) =>
  BASES.find((b) => b.id === id) ?? (BASES[0] as (typeof BASES)[number]);

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

/**
 * OKLCH to sRGB as the browser paints it: clipped to the sRGB gamut, then rounded to 8 bits per
 * channel (0-255). Unrounded, a colour can measure 4.50:1 and paint at 4.47:1.
 */
export function srgb8({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lms = [
    (l + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (l - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (l - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ] as const;
  const encode = (v: number) => {
    const x = Math.min(1, Math.max(0, v));
    return Math.round(255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
  };
  return [
    encode(4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2]),
    encode(-1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2]),
    encode(-0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2]),
  ];
}

/** 8-bit sRGB to OKLCH (Ottosson's matrices), rounded as `ok()` writes it */
function fromRgb(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = c < 1e-4 ? 0 : ((((Math.atan2(B, A) * 180) / Math.PI) % 360) + 360) % 360;
  return { l: +L.toFixed(4), c: c < 1e-4 ? 0 : +c.toFixed(4), h: +h.toFixed(2) };
}

export const toHex = (o: Oklch) =>
  `#${srgb8(o)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;

/** A typed colour: `#rgb`, `#rrggbb` or `oklch(L C H)` with L as 0-1 or a percentage; else null. */
export function parseColor(input: string): Oklch | null {
  const s = input.trim().toLowerCase();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((d) => d + d).join("") : hex;
    return fromRgb([0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb);
  }
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+(-?[\d.]+)(?:deg)?\s*\)$/.exec(s);
  if (!m) return null;
  const l = Number(m[1]) / (m[2] ? 100 : 1);
  const c = Number(m[3]);
  const h = Number(m[4]);
  if (![l, c, h].every(Number.isFinite) || l > 1) return null;
  return { l, c: Math.min(c, 0.4), h: ((h % 360) + 360) % 360 };
}

/** WCAG 2 contrast ratio of two colours as painted, from 1 to 21. */
export const contrast = (x: Oklch, y: Oklch) => contrastRgb(srgb8(x), srgb8(y));

/** WCAG 2 contrast ratio of two 8-bit sRGB colours, from 1 to 21. */
export function contrastRgb(x: Rgb, y: Rgb): number {
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([r, g, b]: Rgb) =>
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * APCA lightness contrast (Lc) of text on a background, both 8-bit sRGB, APCA-W3 0.0.98G-4g.
 * Positive for dark text on a light background, negative for light on dark; about 106 and -108
 * at most.
 */
export function apca(text: Rgb, bg: Rgb): number {
  const y = ([r, g, b]: Rgb) => {
    const v =
      0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
    // Soft clamp near black
    // biome-ignore lint/suspicious/noApproximativeNumericConstant: APCA's blkClmp is exactly 1.414, not √2
    return v > 0.022 ? v : v + (0.022 - v) ** 1.414;
  };
  const t = y(text);
  const b = y(bg);
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) {
    const s = (b ** 0.56 - t ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (b ** 0.65 - t ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

/** Matches the semantic fills in `chunks-ui/theme.css`. */
const FILLS = {
  success: { l: 0.7514, c: 0.1514, h: 166.5 },
  warning: { l: 0.7797, c: 0.1665, h: 72.45 },
  destructive: { l: 0.582, c: 0.2249, h: 25.88 },
} satisfies Record<string, Oklch>;

/** For the default theme, matches every colour token in `chunks-ui/theme.css` (the spec checks it). */
export function palette(t: Theme, mode: Mode): Record<string, string> {
  const b = baseOf(t.base);
  const n = (l: number, k = 1) => ok(l, b.c * k, b.h);
  const d = mode === "dark";
  const p = t.primary;
  const ink = p.c < 0.01;
  // White or dark text on a fill, whichever has more contrast. The two can't both reach 4.5:1.
  const textOn = (f: Oklch) => {
    const white = contrast({ l: 0.985, c: 0, h: 0 }, f);
    return white >= contrast({ l: 0.145, c: b.c, h: b.h }, f) ? "oklch(0.985 0 0)" : n(0.145);
  };
  const primary = ink ? (d ? n(0.922) : n(0.205)) : ok(p.l, p.c, p.h);
  const out: Record<string, string> = {
    primary,
    "primary-foreground": ink ? (d ? n(0.205) : n(0.985)) : textOn(p),
    success: ok(FILLS.success.l, FILLS.success.c, FILLS.success.h),
    "success-foreground": textOn(FILLS.success),
    warning: ok(FILLS.warning.l, FILLS.warning.c, FILLS.warning.h),
    "warning-foreground": textOn(FILLS.warning),
    destructive: ok(FILLS.destructive.l, FILLS.destructive.c, FILLS.destructive.h),
    "destructive-foreground": textOn(FILLS.destructive),
    background: d ? n(0.145) : "oklch(1 0 0)",
    foreground: d ? n(0.985) : n(0.145),
    card: d ? n(0.145) : "oklch(1 0 0)",
    "card-foreground": d ? n(0.985) : n(0.145),
    popover: d ? n(0.145) : "oklch(1 0 0)",
    "popover-foreground": d ? n(0.985) : n(0.145),
    secondary: d ? n(0.269) : n(0.97),
    "secondary-foreground": d ? n(0.985) : n(0.205),
    muted: d ? n(0.269) : n(0.97),
    "muted-foreground": d ? n(0.708, 2) : n(0.53, 2),
    accent: d ? n(0.269) : n(0.97),
    "accent-foreground": d ? n(0.985) : n(0.205),
    border: d ? n(0.269) : n(0.922),
    input: d ? n(0.269) : n(0.922),
    // Same mix as theme.css, so --ring resolves against the scope's own tokens.
    ring: "color-mix(in oklab, var(--primary) 60%, var(--background))",
  };
  chartList(t, mode).forEach((v, i) => {
    out[`chart-${i + 1}`] = v;
  });
  // Hand-set colours win. A derived token (`primary-text`, `ring`, …) set here stops following
  // its fill.
  for (const [token, v] of Object.entries(t.overrides?.[mode] ?? {})) {
    out[token] = ok(v.l, v.c, v.h);
  }
  return out;
}
