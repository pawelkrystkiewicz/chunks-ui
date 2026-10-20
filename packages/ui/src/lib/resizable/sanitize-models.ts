import {
  defaultLayout,
  fitPixels,
  type Limits,
  normalizePercents,
  type PanelModel,
} from "./layout";
import type { ResizableLayout } from "./types";

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);

/** A px panel's value inside its px limits. A % limit needs the group's size, so it is left out. */
function clampPx(model: PanelModel, value: number) {
  const min = model.min?.unit === "px" ? model.min.value : 0;
  const max = model.max?.unit === "px" ? model.max.value : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Brings the % shares of a group with no px panel inside their % limits, still summing to 100.
 * A share is then a percent of the whole group, so the limits can be read without measuring.
 */
function fitShares(models: readonly PanelModel[], layout: ResizableLayout): ResizableLayout {
  if (models.some((m) => m.unit === "px")) return layout;
  const limits: Limits[] = models.map((m) => {
    const min = m.min?.unit === "%" ? m.min.value : 0;
    const max = m.max?.unit === "%" ? m.max.value : Number.POSITIVE_INFINITY;
    return { min, max: Math.max(min, max) };
  });
  const fitted = fitPixels(
    models.map((m) => layout[m.id] ?? 0),
    limits,
    100,
  );
  return Object.fromEntries(models.map((m, i) => [m.id, fitted[i] ?? 0]));
}

/** `sanitizeLayout` for panels that are already parsed. */
export function sanitizeModels(raw: unknown, models: readonly PanelModel[]): ResizableLayout {
  const defaults = defaultLayout(models);
  if (!isRecord(raw)) return defaults;
  const layout: ResizableLayout = {};
  const missing: PanelModel[] = [];
  let suppliedShares = 0;
  for (const model of models) {
    const value = Object.hasOwn(raw, model.id) ? raw[model.id] : undefined;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      layout[model.id] = model.unit === "px" ? clampPx(model, value) : value;
      if (model.unit === "%") suppliedShares += value;
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
    layout[model.id] = model.unit === "px" ? clampPx(model, share) : share;
  }
  return fitShares(models, normalizePercents(models, layout));
}
