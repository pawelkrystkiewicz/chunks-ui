import type { Overrides } from "./theme-model";

export const UNDO_STEPS = 50;

/**
 * Hand-set colours before each edit; a slider drag is one step. `last` is the overrides the panel
 * itself produced (by an edit or an undo). When anything else sets them (presets, shuffle, the
 * sidebar), the steps no longer belong to the theme.
 */
export type Trail = { steps: (Overrides | undefined)[]; last?: Overrides };

export const EMPTY_TRAIL: Trail = { steps: [] };

/**
 * The trail after an edit from `current` to `next`. The first event of a gesture, or any edit that
 * is not a drag, pushes `current`; later events of the same drag only move `last`. Built from the
 * trail it is given, so events handled before a re-render stack up.
 */
export function nextTrail(
  trail: Trail,
  current: Overrides | undefined,
  next: Overrides | undefined,
  drag: boolean,
  dragging: boolean,
): Trail {
  if (drag && dragging) return { steps: trail.steps, last: next };
  const kept = trail.last === current ? trail.steps : [];
  return { steps: [...kept.slice(1 - UNDO_STEPS), current], last: next };
}

/** The trail after undoing the step on top; the same trail when it doesn't belong to `current` */
export function undoTrail(trail: Trail, current: Overrides | undefined): Trail {
  if (trail.last !== current || trail.steps.length === 0) return trail;
  return { steps: trail.steps.slice(0, -1), last: trail.steps.at(-1) };
}
