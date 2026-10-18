import { describe, expect, it } from "vitest";
import type { Oklch, Overrides } from "./theme-model";
import { EMPTY_TRAIL, nextTrail, undoTrail } from "./undo-trail";

const c: Oklch = { l: 0.5, c: 0.1, h: 10 };
const o = (l: number): Overrides => ({ light: { muted: { ...c, l } } });
const [a, b, d, e] = [o(0.1), o(0.2), o(0.3), o(0.4)];

describe("the undo trail", () => {
  it("takes two drag events in a row as one step holding the pre-drag overrides", () => {
    // Both events are built before any re-render: `current` is the same for each
    const first = nextTrail(EMPTY_TRAIL, a, b, true, false);
    const second = nextTrail(first, a, d, true, true);
    expect(second.steps).toEqual([a]);
    expect(second.last).toBe(d);
  });

  it("adds a second step for an edit after a finished drag", () => {
    const drag = nextTrail(nextTrail(EMPTY_TRAIL, a, b, true, false), a, d, true, true);
    const typed = nextTrail(drag, d, e, false, false);
    expect(typed.steps).toEqual([a, d]);
  });

  it("starts fresh when the trail's last overrides are not the current ones", () => {
    const trail = nextTrail(EMPTY_TRAIL, a, b, false, false);
    expect(nextTrail(trail, d, e, false, false).steps).toEqual([d]);
  });

  it("pops a step on undo, and ignores an undo of a stale trail", () => {
    const trail = nextTrail(nextTrail(EMPTY_TRAIL, a, b, false, false), b, d, false, false);
    expect(undoTrail(trail, d)).toEqual({ steps: [a], last: b });
    expect(undoTrail(trail, e)).toBe(trail);
  });
});
