/**
 * The maths of a resizable group. Plain TypeScript: no React, no DOM, so a framework-agnostic
 * core can take this folder as it is.
 *
 * Vocabulary:
 * - A **layout** maps a panel id to its size in the unit the panel declares: px for a px panel,
 *   a share for a % panel.
 * - A **% share** is a share of the space the px panels leave. With no px panel it is a share of
 *   the whole group. The shares of a group's % panels sum to 100.
 * - The **available** size is the group's size along its axis, minus its handles and its own
 *   padding and border.
 * - A min or max limit in % is a percent of the available size.
 */
import { type PanelSize, type ParsedSize, parseSize, type Unit } from "./size";

/** Panel id to size, each in the unit its panel declares. */
export type Layout = Record<string, number>;

/** What a panel declares. `Resizable.Panel` takes the same fields as props. */
export type PanelConfig = {
  id: string;
  defaultSize?: PanelSize;
  minSize?: PanelSize;
  maxSize?: PanelSize;
};

/** A panel after its sizes are parsed. */
export type PanelModel = {
  id: string;
  unit: Unit;
  /** In `unit`. A px panel always has one; a % panel has one when it declared a `defaultSize` */
  defaultValue: number | undefined;
  min?: ParsedSize;
  max?: ParsedSize;
};

/** A programmer error found while reading panel configs, as a message */
export type LayoutWarning = string;

export type Limits = { min: number; max: number };

const EPSILON = 1e-6;
const FREE = Number.POSITIVE_INFINITY;

const round2 = (value: number) => Math.round(value * 100) / 100;
const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Parses panel configs into models. A duplicate or empty id is dropped, an unreadable size is
 * ignored, and a max below its min (same unit) is raised to the min. Each is reported to `warn`;
 * nothing throws.
 */
export function buildModels(
  configs: readonly PanelConfig[],
  warn?: (message: LayoutWarning) => void,
): PanelModel[] {
  const models: PanelModel[] = [];
  const seen = new Set<string>();
  const read = (id: string, field: string, input: unknown) => {
    if (input === undefined) return undefined;
    const parsed = parseSize(input);
    if (!parsed) warn?.(`Panel "${id}": \`${field}\` is not a size (${JSON.stringify(input)})`);
    return parsed;
  };
  for (const config of configs) {
    const { id } = config;
    if (typeof id !== "string" || id === "") {
      warn?.("A panel has no `id`: give every panel a stable, non-empty `id`");
      continue;
    }
    if (seen.has(id)) {
      warn?.(`Panel id "${id}" is a duplicate: the first panel keeps it, the rest are ignored`);
      continue;
    }
    seen.add(id);
    const size = read(id, "defaultSize", config.defaultSize);
    const min = read(id, "minSize", config.minSize);
    let max = read(id, "maxSize", config.maxSize);
    if (min && max && min.unit === max.unit && max.value < min.value) {
      warn?.(`Panel "${id}": \`maxSize\` is below \`minSize\`, so it is raised to it`);
      max = min;
    }
    models.push({
      id,
      unit: size?.unit ?? "%",
      defaultValue: size?.value,
      ...(min && { min }),
      ...(max && { max }),
    });
  }
  return models;
}

/** Scales the % panels' shares to sum to 100. Px panels keep their size. Returns a new layout. */
export function normalizePercents(models: readonly PanelModel[], layout: Layout): Layout {
  const out: Layout = { ...layout };
  const percent = models.filter((m) => m.unit === "%");
  const total = sum(percent.map((m) => out[m.id] ?? 0));
  for (const m of percent) {
    out[m.id] = total > 0 ? ((out[m.id] ?? 0) / total) * 100 : 100 / percent.length;
  }
  return out;
}

/**
 * The layout the declared `defaultSize`s describe. A % panel without one takes an equal part of
 * what the others leave of 100. The % shares are normalised to sum to 100.
 */
export function defaultLayout(models: readonly PanelModel[]): Layout {
  const out: Layout = {};
  const unspecified: PanelModel[] = [];
  let specified = 0;
  for (const m of models) {
    if (m.defaultValue === undefined) {
      unspecified.push(m);
      continue;
    }
    out[m.id] = m.defaultValue;
    if (m.unit === "%") specified += m.defaultValue;
  }
  const rest = specified < 100 ? 100 - specified : 100;
  for (const m of unspecified) out[m.id] = rest / unspecified.length;
  return normalizePercents(models, out);
}

/** The panels' sizes in px along the axis, in panel order. */
export function toPixels(
  models: readonly PanelModel[],
  layout: Layout,
  available: number,
): number[] {
  const fixed = sum(models.map((m) => (m.unit === "px" ? (layout[m.id] ?? 0) : 0)));
  const flexible = Math.max(0, available - fixed);
  const shares = sum(models.map((m) => (m.unit === "%" ? (layout[m.id] ?? 0) : 0)));
  const percentCount = models.filter((m) => m.unit === "%").length;
  return models.map((m) => {
    const value = layout[m.id] ?? 0;
    if (m.unit === "px") return value;
    return shares > 0 ? (value / shares) * flexible : flexible / percentCount;
  });
}

/** The inverse of `toPixels`: sizes in px back to a layout, rounded to two decimals. */
export function fromPixels(models: readonly PanelModel[], px: readonly number[]): Layout {
  const out: Layout = {};
  const flexible = sum(models.map((m, i) => (m.unit === "%" ? (px[i] ?? 0) : 0)));
  const percentCount = models.filter((m) => m.unit === "%").length;
  models.forEach((m, i) => {
    const size = px[i] ?? 0;
    if (m.unit === "px") out[m.id] = round2(size);
    else out[m.id] = round2(flexible > 0 ? (size / flexible) * 100 : 100 / percentCount);
  });
  return out;
}

/**
 * Each panel's min and max in px. With `ignoreAbsolute` (the size is unknown) a px limit is
 * dropped and a % limit is read against `available` as given.
 */
export function limitsPx(
  models: readonly PanelModel[],
  available: number,
  ignoreAbsolute = false,
): Limits[] {
  const resolve = (size: ParsedSize | undefined, fallback: number) => {
    if (!size) return fallback;
    if (size.unit === "px") return ignoreAbsolute ? fallback : size.value;
    return (size.value / 100) * available;
  };
  return models.map((m) => {
    const min = resolve(m.min, 0);
    return { min, max: Math.max(min, resolve(m.max, FREE)) };
  });
}

const clampTo = (value: number, { min, max }: Limits) => Math.min(Math.max(value, min), max);

/**
 * How far the boundary after panel `index` may move, as the change in that panel's size:
 * `min` <= 0 <= `max`. Both neighbours' limits bind it; a pane already outside its limits may
 * not move further out.
 */
export function deltaRange(
  px: readonly number[],
  limits: readonly Limits[],
  index: number,
): { min: number; max: number } {
  const before = px[index];
  const after = px[index + 1];
  const lb = limits[index];
  const la = limits[index + 1];
  if (before === undefined || after === undefined || !lb || !la) return { min: 0, max: 0 };
  return {
    min: Math.min(0, Math.max(lb.min - before, after - la.max)),
    max: Math.max(0, Math.min(lb.max - before, after - la.min)),
  };
}

/**
 * Moves the boundary after panel `index` by `delta` px (negative shrinks that panel), within both
 * neighbours' limits. Only those two panels change. Returns `px` itself when nothing moves.
 */
export function resizeBetween(
  px: readonly number[],
  limits: readonly Limits[],
  index: number,
  delta: number,
): number[] {
  if (Number.isNaN(delta) || index < 0 || index + 1 >= px.length) return px as number[];
  const range = deltaRange(px, limits, index);
  const moved = Math.min(Math.max(delta, range.min), range.max);
  if (moved === 0) return px as number[];
  const next = [...px];
  next[index] = (px[index] ?? 0) + moved;
  next[index + 1] = (px[index + 1] ?? 0) - moved;
  return next;
}

/**
 * Brings sizes inside their limits and back to the available total: a pane over a limit is
 * clamped, and the difference goes to the panes that have room, in proportion to it. Panes
 * flagged in `absorbs` take it first; the others share it only once those have no room left. A
 * pane that cannot move stops the process, so impossible limits leave the sizes as near as they
 * allow. Returns `px` itself when it already fits.
 */
export function fitPixels(
  px: readonly number[],
  limits: readonly Limits[],
  available: number,
  absorbs?: readonly boolean[],
): number[] {
  if (!(available > 0)) return px as number[];
  const next = px.map((value, i) => (limits[i] ? clampTo(value, limits[i]) : value));
  for (let pass = 0; pass <= next.length; pass++) {
    const diff = available - sum(next);
    if (Math.abs(diff) < EPSILON) break;
    const room = next.map((value, i) => {
      const limit = limits[i] ?? { min: 0, max: FREE };
      return Math.min(diff > 0 ? limit.max - value : value - limit.min, available);
    });
    const preferred = room.map((r, i) => (absorbs && !absorbs[i] ? 0 : r));
    const usable = sum(preferred) >= EPSILON ? preferred : room;
    const total = sum(usable);
    if (total < EPSILON) break;
    for (let i = 0; i < next.length; i++) {
      const share = Math.min(usable[i] ?? 0, (Math.abs(diff) * (usable[i] ?? 0)) / total);
      next[i] = (next[i] ?? 0) + Math.sign(diff) * share;
    }
  }
  return next.every((value, i) => Math.abs(value - (px[i] ?? 0)) < EPSILON)
    ? (px as number[])
    : next;
}

/**
 * The layout as it shows in a group of `available` px: sizes pushed inside their limits (a min in
 * px that the group is too small for, say) with the % shares re-normalised. % panels absorb the
 * difference before px panels do. Returns `layout`
 * itself when it already fits, and always when the size is unknown.
 */
export function fitLayout(
  models: readonly PanelModel[],
  layout: Layout,
  available: number,
): Layout {
  if (!(available > 0) || models.length === 0) return layout;
  const px = toPixels(models, layout, available);
  const fitted = fitPixels(
    px,
    limitsPx(models, available),
    available,
    models.map((m) => m.unit === "%"),
  );
  return fitted === px ? layout : fromPixels(models, fitted);
}

export type Orientation = "horizontal" | "vertical";

/** What a key asks of the handle: move the boundary a step, or send it to a limit. */
export type ResizeAction =
  | { type: "step"; direction: 1 | -1; large: boolean }
  | { type: "limit"; direction: 1 | -1 };

/**
 * The action a key stands for, or null. `direction` 1 grows the panel before the handle. The
 * arrows of the group's axis step it, the horizontal pair flipped in RTL; Home and End go to the
 * limits, whatever the direction.
 */
export function keyToAction(
  key: string,
  { orientation, rtl, shift }: { orientation: Orientation; rtl: boolean; shift: boolean },
): ResizeAction | null {
  if (key === "Home") return { type: "limit", direction: -1 };
  if (key === "End") return { type: "limit", direction: 1 };
  let direction: 1 | -1 | 0 = 0;
  if (orientation === "horizontal") {
    if (key === "ArrowRight") direction = rtl ? -1 : 1;
    else if (key === "ArrowLeft") direction = rtl ? 1 : -1;
  } else if (key === "ArrowDown") direction = 1;
  else if (key === "ArrowUp") direction = -1;
  return direction === 0 ? null : { type: "step", direction, large: shift };
}

/** A key step in px: 1% of the available size, 10% when large, at least 1px. */
export function stepSize(available: number, large: boolean) {
  return Math.max(1, large ? available / 10 : available / 100);
}

/** The change in the before panel's size an action asks for: infinite for a limit. */
export function actionDelta(action: ResizeAction, available: number) {
  return action.type === "limit"
    ? action.direction * FREE
    : action.direction * stepSize(available, action.large);
}

/**
 * The values of the handle after panel `index`, for `aria-valuenow`, `-valuemin` and `-valuemax`:
 * the before panel's size and the range it can reach, as a percent of the available size. With no
 * measured size (`available` <= 0) a group of % panels still has them, read against 100; a group
 * with a px panel has not. Also undefined for a handle without two neighbours.
 */
export function ariaValues(
  models: readonly PanelModel[],
  layout: Layout,
  index: number,
  available: number,
): { now: number; min: number; max: number } | undefined {
  if (index < 0 || index + 1 >= models.length) return undefined;
  const known = available > 0;
  if (!known && models.some((m) => m.unit === "px")) return undefined;
  const total = known ? available : 100;
  const px = toPixels(models, layout, total);
  const range = deltaRange(px, limitsPx(models, total, !known), index);
  const now = px[index] ?? 0;
  const percent = (value: number) => round2(Math.min(100, Math.max(0, (value / total) * 100)));
  return { now: percent(now), min: percent(now + range.min), max: percent(now + range.max) };
}
