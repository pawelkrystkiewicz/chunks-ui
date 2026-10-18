// Contrast of a /create theme in both modes, from the tokens "Get code" exports. Pure maths: the
// derived shades (coloured text, success and warning borders, the ring, hover fills) follow
// theme.css and the component classes.

import {
  apca,
  contrastRgb,
  type Mode,
  type Oklch,
  palette,
  type Rgb,
  srgb8,
  type Theme,
} from "./palette";
import { TEXT_STEPS, withOverride } from "./theme-model";

type Group = "Text" | "Controls" | "Charts";

/**
 * One colour of a pair. A plain token is set directly. With `from`, it is a shade derived from that
 * fill until its own token is set. A `locked` shade (a hover fill) never takes one.
 */
export type Side = { token: string; from?: string; locked?: boolean };

/** How the text of a pair is set and used: its size and weight decide WCAG large text and APCA's lookup */
type TextUse = { use: "body" | "fluent"; step: keyof typeof TEXT_STEPS; weight: number };

type Row = { id: string; group: Group; label: string; fg: Side; bg: Side; text?: TextUse };

export type Check = Row & {
  /** Text size in px at the theme's base size */
  size?: number;
  /** The WCAG ratio and APCA Lc the chosen levels ask for (Infinity: text too small) */
  target: { wcag: number; apca: number };
  color: Record<Mode, { fg: Rgb; bg: Rgb }>;
  wcag: Record<Mode, number>;
  /** Signed Lc: negative for light on dark */
  apca: Record<Mode, number>;
};

export const APCA_LEVELS = ["Bronze", "Silver", "Gold"] as const;
export type ApcaLevel = (typeof APCA_LEVELS)[number];
export const WCAG_LEVELS = ["AA", "AAA"] as const;
export type WcagLevel = (typeof WCAG_LEVELS)[number];
export type Levels = { wcag: WcagLevel; apca: ApcaLevel };

/**
 * The WCAG 2 ratio a pair needs. Text: 4.5:1 at AA and 7:1 at AAA; large text (24px, or 18.66px
 * bold) 3:1 and 4.5:1. Non-text (1.4.11) has no AAA: 3:1.
 */
export function wcagTarget(level: WcagLevel, text?: { size: number; weight: number }): number {
  if (!text) return 3;
  const large = text.size >= 24 || (text.size >= 18.66 && text.weight >= 700);
  if (level === "AA") return large ? 3 : 4.5;
  return large ? 4.5 : 7;
}

/**
 * APCA Readability Criterion font lookup (readtech.org/ARC, Silver and Gold): the Lc content text
 * needs by CSS px size (rows) and weight 100-900 (columns). 0 marks a size and weight content text
 * may not use.
 */
const LOOKUP: [number, number[]][] = [
  [10, [0, 0, 0, 0, 0, 0, 0, 0, 0]],
  [12, [0, 0, 0, 0, 0, 0, 0, 0, 0]],
  [14, [0, 0, 0, 100, 100, 90, 75, 0, 0]],
  [15, [0, 0, 0, 100, 90, 75, 70, 0, 0]],
  [16, [0, 0, 0, 90, 75, 70, 60, 60, 0]],
  [18, [0, 0, 100, 75, 70, 60, 55, 55, 55]],
  [21, [0, 0, 90, 70, 60, 55, 50, 50, 50]],
  [24, [0, 0, 75, 60, 55, 50, 45, 45, 45]],
  [28, [0, 100, 70, 55, 50, 45, 43, 43, 43]],
  [32, [0, 90, 65, 50, 45, 43, 40, 40, 40]],
  [36, [0, 75, 60, 45, 43, 40, 38, 38, 38]],
  [48, [90, 60, 55, 43, 40, 38, 35, 35, 35]],
  [60, [75, 55, 50, 40, 38, 35, 33, 33, 33]],
  [72, [60, 50, 45, 38, 35, 33, 30, 30, 30]],
  [96, [50, 45, 40, 35, 33, 30, 25, 25, 25]],
];

/**
 * The Lc text needs at an APCA level. Bronze uses fixed levels. Silver and Gold read the lookup at
 * the largest listed size not above `size` (the stricter row), with a 14px (Silver) or 16px (Gold)
 * minimum; Gold adds Lc 15 to body text under Lc 75.
 */
export function apcaTarget(
  level: ApcaLevel,
  { use, weight }: Pick<TextUse, "use" | "weight">,
  size: number,
): number {
  if (level === "Bronze") return use === "body" ? 75 : 60;
  if (size < (level === "Gold" ? 16 : 14)) return Number.POSITIVE_INFINITY;
  const row = LOOKUP.filter(([px]) => px <= size).at(-1)?.[1];
  const lc = row?.[Math.round(weight / 100) - 1] || Number.POSITIVE_INFINITY;
  return level === "Gold" && use === "body" && lc < 75 ? lc + 15 : lc;
}

/** WCAG 2 AA: 4.5:1 text, 3:1 non-text. APCA non-text: Lc 30, its minimum for solid marks. */
const NON_TEXT_LC = 30;

type Tokens = {
  get: (name: string) => Oklch;
  /** The token holds its own oklch() colour, not a derived default */
  has: (name: string) => boolean;
  bg: Oklch;
  dark: boolean;
};

const parse = (s: string): Oklch => {
  const m = /^oklch\(([\d.]+) ([\d.]+) (-?[\d.]+)\)$/.exec(s);
  if (!m) throw new Error(`Not an oklch() colour: "${s}"`);
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
};

/** `color-mix(in oklab, x p, y)` */
export function mix(x: Oklch, y: Oklch, p: number): Oklch {
  const lab = ({ l, c, h }: Oklch) =>
    [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)] as const;
  const [l1, a1, b1] = lab(x);
  const [l2, a2, b2] = lab(y);
  const a = a1 * p + a2 * (1 - p);
  const b = b1 * p + b2 * (1 - p);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l: l1 * p + l2 * (1 - p), c: Math.hypot(a, b), h: (h + 360) % 360 };
}

/** `x` at opacity `alpha` painted over `y`: the browser blends 8-bit sRGB */
const over = (x: Rgb, y: Rgb, alpha: number) =>
  x.map((v, i) => Math.round(v * alpha + (y[i] ?? 0) * (1 - alpha))) as Rgb;

function tokensOf(t: Theme, mode: Mode): Tokens {
  const pal = palette(t, mode);
  const get = (name: string) => parse(pal[name] ?? "");
  const has = (name: string) => pal[name]?.startsWith("oklch(") ?? false;
  return { get, has, bg: get("background"), dark: mode === "dark" };
}

/** `--colored-text-lightness`: min(l, 0.51) light, max(l, 0.63) dark */
const text = (k: Tokens, fill: string): Oklch => {
  const f = k.get(fill);
  return { ...f, l: k.dark ? Math.max(f.l, 0.63) : Math.min(f.l, 0.51) };
};

/** `--success-border-lightness` and `--warning-border-lightness`: capped in light mode only */
const border = (k: Tokens, fill: string, cap: number): Oklch => {
  const f = k.get(fill);
  return k.dark ? f : { ...f, l: Math.min(f.l, cap) };
};

/** The defaults theme.css derives, until the token is set */
const DERIVE: Record<string, (k: Tokens) => Oklch> = {
  "primary-text": (k) => text(k, "primary"),
  "success-text": (k) => text(k, "success"),
  "warning-text": (k) => text(k, "warning"),
  "destructive-text": (k) => text(k, "destructive"),
  "success-border": (k) => border(k, "success", 0.64),
  "warning-border": (k) => border(k, "warning", 0.67),
  ring: (k) => mix(k.get("primary"), k.bg, 0.6),
};

/** The colour a side has, or null for a locked shade */
function resolve(k: Tokens, side: Side): Oklch | null {
  if (side.locked) return null;
  if (!side.from || k.has(side.token)) return k.get(side.token);
  const derive = DERIVE[side.token];
  if (!derive) throw new Error(`No derivation for ${side.token}`);
  return derive(k);
}

/** The colour of a side in `mode`, as the editor starts from it, or null for a locked shade */
export const sideColor = (t: Theme, mode: Mode, side: Side) => resolve(tokensOf(t, mode), side);

export const isCustom = (t: Theme, mode: Mode, token: string) => !!t.overrides?.[mode]?.[token];

/** The tokens a side's colour comes from in `mode`: its own, or its fill's while it follows one */
function reads(t: Theme, mode: Mode, side: Side): string[] {
  if (side.locked) return [side.from ?? "", "background"];
  if (!side.from || isCustom(t, mode, side.token)) return [side.token];
  // The ring mixes the primary with the background
  return side.token === "ring" ? ["primary", "background"] : [side.from];
}

/** Whether setting `token` in `mode` changes the pair: it reads the token, or is that token */
export const affects = (t: Theme, mode: Mode, check: Check, token: string) =>
  [check.fg, check.bg].some((s) => s.token === token || reads(t, mode, s).includes(token));

const T = (token: string): Side => ({ token });
const BG = T("background");
const ROLES = ["primary", "success", "warning", "destructive"] as const;
const title = (s: string) => `${s[0]?.toUpperCase()}${s.slice(1)}`;
// Sizes and weights as the components set them: body and card descriptions text-sm, buttons
// text-sm font-medium, card titles text-lg font-semibold, Field.Error text-xs
const BODY: TextUse = { use: "body", step: "sm", weight: 400 };
const TEXT: TextUse = { use: "fluent", step: "sm", weight: 400 };
const LABEL: TextUse = { use: "fluent", step: "sm", weight: 500 };

const ROWS: Row[] = [
  { id: "body", group: "Text", label: "Body text", fg: T("foreground"), bg: BG, text: BODY },
  {
    id: "card-title",
    group: "Text",
    label: "Card title",
    fg: T("card-foreground"),
    bg: T("card"),
    text: { use: "fluent", step: "lg", weight: 600 },
  },
  {
    id: "muted",
    group: "Text",
    label: "Muted text",
    fg: T("muted-foreground"),
    bg: BG,
    text: TEXT,
  },
  {
    id: "muted-on-muted",
    group: "Text",
    label: "Muted text on muted",
    fg: T("muted-foreground"),
    bg: T("muted"),
    text: TEXT,
  },
  {
    id: "secondary",
    group: "Text",
    label: "Secondary button",
    fg: T("secondary-foreground"),
    bg: T("secondary"),
    text: LABEL,
  },
  ...ROLES.map(
    (role): Row => ({
      id: `on-${role}`,
      group: "Text",
      label: `${title(role)} button`,
      fg: T(`${role}-foreground`),
      bg: T(role),
      text: LABEL,
    }),
  ),
  // Contained buttons hover at `bg-{role}/90`, over the card
  ...ROLES.map(
    (role): Row => ({
      id: `on-${role}-hover`,
      group: "Text",
      label: `${title(role)} button, hover`,
      fg: T(`${role}-foreground`),
      bg: { token: `${role}-hover`, from: role, locked: true },
      text: LABEL,
    }),
  ),
  ...ROLES.map(
    (role): Row => ({
      id: `${role}-text`,
      group: "Text",
      label: `${title(role)} text`,
      fg: { token: `${role}-text`, from: role },
      bg: BG,
      // Outlined and text buttons; destructive text is mostly Field.Error
      text: role === "destructive" ? { use: "fluent", step: "xs", weight: 400 } : LABEL,
    }),
  ),
  {
    id: "ring",
    group: "Controls",
    label: "Focus ring",
    fg: { token: "ring", from: "primary" },
    bg: BG,
  },
  { id: "input", group: "Controls", label: "Input border", fg: T("input"), bg: BG },
  {
    id: "primary-border",
    group: "Controls",
    label: "Outlined primary border",
    fg: T("primary"),
    bg: BG,
  },
  {
    id: "success-border",
    group: "Controls",
    label: "Outlined success border",
    fg: { token: "success-border", from: "success" },
    bg: BG,
  },
  {
    id: "warning-border",
    group: "Controls",
    label: "Outlined warning border",
    fg: { token: "warning-border", from: "warning" },
    bg: BG,
  },
  {
    id: "destructive-border",
    group: "Controls",
    label: "Outlined destructive border",
    fg: T("destructive"),
    bg: BG,
  },
  ...[1, 2, 3, 4, 5].map(
    (i): Row => ({
      id: `chart-${i}`,
      group: "Charts",
      label: `Chart ${i}`,
      fg: T(`chart-${i}`),
      bg: BG,
    }),
  ),
  // Neighbouring series, as in a stacked bar or a pie: told apart by lightness alone
  ...[1, 2, 3, 4].map(
    (i): Row => ({
      id: `chart-${i}-${i + 1}`,
      group: "Charts",
      label: `Chart ${i} next to ${i + 1}`,
      fg: T(`chart-${i + 1}`),
      bg: T(`chart-${i}`),
    }),
  ),
];

function paint(k: Tokens, side: Side): Rgb {
  const color = resolve(k, side);
  if (color) return srgb8(color);
  // A locked side is a hover fill: its fill at 90% over the background
  return over(srgb8(k.get(side.from ?? "")), srgb8(k.bg), 0.9);
}

export const DEFAULT_LEVELS: Levels = { wcag: "AA", apca: "Bronze" };

export function themeChecks(t: Theme, levels: Levels = DEFAULT_LEVELS): Check[] {
  const tokens = { light: tokensOf(t, "light"), dark: tokensOf(t, "dark") };
  return ROWS.map((row) => {
    const color = {
      light: { fg: paint(tokens.light, row.fg), bg: paint(tokens.light, row.bg) },
      dark: { fg: paint(tokens.dark, row.fg), bg: paint(tokens.dark, row.bg) },
    };
    const size = row.text && (TEXT_STEPS[row.text.step] * t.fontSize) / 14;
    return {
      ...row,
      size,
      target: {
        wcag: wcagTarget(levels.wcag, size ? { size, weight: row.text?.weight ?? 400 } : undefined),
        apca: row.text && size ? apcaTarget(levels.apca, row.text, size) : NON_TEXT_LC,
      },
      color,
      wcag: {
        light: contrastRgb(color.light.fg, color.light.bg),
        dark: contrastRgb(color.dark.fg, color.dark.bg),
      },
      apca: {
        light: apca(color.light.fg, color.light.bg),
        dark: apca(color.dark.fg, color.dark.bg),
      },
    };
  });
}

export const passWcag = (c: Check, mode: Mode) => c.wcag[mode] >= c.target.wcag;
export const passApca = (c: Check, mode: Mode) => Math.abs(c.apca[mode]) >= c.target.apca;

/** Rounded down, so a ratio that misses its target never prints as the target */
export const formatRatio = (ratio: number) => (Math.floor(ratio * 100) / 100).toFixed(2);

/** Lc without its polarity sign, rounded down like formatRatio */
export const formatLc = (lc: number) => (Math.floor(Math.abs(lc) * 10) / 10).toFixed(1);

/**
 * The nearest lightness, same chroma and hue, at which `side` makes the pair pass both measures in
 * `mode`, searched in 0.005 steps both ways; null when none does or the side is locked.
 */
export function nudge(t: Theme, levels: Levels, mode: Mode, id: string, side: Side): Oklch | null {
  const start = sideColor(t, mode, side);
  if (!start) return null;
  const passes = (l: number) => {
    const trial = { ...t, overrides: withOverride(t.overrides, mode, side.token, { ...start, l }) };
    const c = themeChecks(trial, levels).find((x) => x.id === id);
    return !!c && passWcag(c, mode) && passApca(c, mode);
  };
  for (let i = 0; i <= 200; i++) {
    // Rounded as oklch() is written, so the value found is the value painted
    for (const l of [start.l - i * 0.005, start.l + i * 0.005].map((x) => +x.toFixed(4))) {
      if (l >= 0 && l <= 1 && passes(l)) return { ...start, l };
    }
  }
  return null;
}
