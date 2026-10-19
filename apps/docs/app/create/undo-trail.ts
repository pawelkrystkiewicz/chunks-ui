import type { Overrides } from "./theme-model";

const UNDO_STEPS = 50;

/**
 * Hand-set colours before each edit; a slider drag is one step. `redo` holds the ones undone, the
 * latest last. `last` is the overrides the panel itself produced (by an edit, an undo or a redo).
 * When anything else sets them (presets, shuffle, the sidebar), the steps no longer belong to the
 * theme.
 */
export type Trail = {
  steps: (Overrides | undefined)[];
  redo?: (Overrides | undefined)[];
  last?: Overrides;
};

export const EMPTY_TRAIL: Trail = { steps: [] };

/**
 * No hand-set colours, as the panel writes it. Presets, shuffle and the resets write `undefined`,
 * so a trail whose `last` is NONE no longer belongs to the theme after one of those.
 */
export const NONE: Overrides = {};

/**
 * The trail after an edit from `current` to `next`. The first event of a gesture, or any edit that
 * is not a drag, pushes `current`; later events of the same drag only move `last`. Built from the
 * trail it is given, so events handled before a re-render stack up. An edit drops what was undone.
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
  return {
    steps: trail.steps.slice(0, -1),
    last: trail.steps.at(-1) ?? NONE,
    redo: [...(trail.redo ?? []), current],
  };
}

/** The trail after redoing the last undo; the same trail when it doesn't belong to `current` */
export function redoTrail(trail: Trail, current: Overrides | undefined): Trail {
  const redo = trail.redo ?? [];
  if (trail.last !== current || redo.length === 0) return trail;
  return { steps: [...trail.steps, current], last: redo.at(-1) ?? NONE, redo: redo.slice(0, -1) };
}
