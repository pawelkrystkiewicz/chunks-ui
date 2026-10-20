import { buildModels } from "./layout";
import { sanitizeModels } from "./sanitize-models";
import type { PanelConfig, ResizableLayout } from "./types";

/**
 * Makes a layout read from storage (a cookie, `localStorage`, a URL) safe to hand to a group.
 *
 * - Anything that is not a plain object gives the defaults.
 * - Ids that match no panel are dropped.
 * - A panel whose `id` is empty or `__proto__`, or that repeats the `id` of an earlier panel, is
 *   skipped.
 * - A missing, non-numeric or negative value is filled from the panel's default; missing % panels
 *   take what the supplied ones leave of 100.
 * - A px panel is clamped to its px min and max.
 * - The % shares are scaled to sum to 100. In a group of % panels only, they are also clamped to
 *   the panels' % min and max. With a px panel in the group a % limit is a percent of the measured
 *   size, so it is left to the group, which applies it once it has measured.
 *
 * Plain TypeScript with no React: call it on the server too.
 */
export function sanitizeLayout(raw: unknown, panels: readonly PanelConfig[]): ResizableLayout {
  return sanitizeModels(raw, buildModels(panels));
}
