import {
  buildModels,
  defaultLayout,
  type Layout,
  normalizePercents,
  type PanelConfig,
  type PanelModel,
} from "./layout";

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

/** Clamps a value to the panel's limits that are in the panel's own unit. */
function clampOwnUnit(model: PanelModel, value: number) {
  const min = model.min?.unit === model.unit ? model.min.value : 0;
  const max = model.max?.unit === model.unit ? model.max.value : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Makes a layout read from storage (a cookie, `localStorage`, a URL) safe to hand to a group.
 *
 * - Anything that is not a plain object gives the defaults.
 * - Ids that match no panel are dropped.
 * - A missing, non-numeric or negative value is filled from the panel's default; missing % panels
 *   take what the supplied ones leave of 100.
 * - Each value is clamped to its panel's min and max in the panel's own unit. A limit in the
 *   other unit needs the group's size, so the group applies it once it is measured.
 * - The % shares are scaled to sum to 100.
 *
 * Plain TypeScript with no React: call it on the server too.
 */
export function sanitizeLayout(raw: unknown, panels: readonly PanelConfig[]): Layout {
  return sanitizeModels(raw, buildModels(panels));
}

/** `sanitizeLayout` for panels that are already parsed. */
export function sanitizeModels(raw: unknown, models: readonly PanelModel[]): Layout {
  const defaults = defaultLayout(models);
  if (!isRecord(raw)) return defaults;
  const layout: Layout = {};
  const missing: PanelModel[] = [];
  let suppliedShares = 0;
  for (const model of models) {
    const value = Object.hasOwn(raw, model.id) ? raw[model.id] : undefined;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      layout[model.id] = clampOwnUnit(model, value);
      if (model.unit === "%") suppliedShares += layout[model.id] ?? 0;
    } else {
      missing.push(model);
    }
  }
  // A missing % panel takes what the supplied ones leave of 100, split as the defaults split it
  const missingShares = missing.reduce(
    (n, m) => n + (m.unit === "%" ? (defaults[m.id] ?? 0) : 0),
    0,
  );
  const rest = suppliedShares < 100 ? 100 - suppliedShares : 0;
  for (const model of missing) {
    const fallback = defaults[model.id] ?? 0;
    const share =
      model.unit === "%" && rest > 0 && missingShares > 0
        ? (rest * fallback) / missingShares
        : fallback;
    layout[model.id] = clampOwnUnit(model, share);
  }
  return normalizePercents(models, layout);
}
