import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { type Insets, insetsWithin, waitForStable } from "../../VisualTest.utils";
import { Switch } from "./index";

/*
 * The thumb must rest one gap away from the track's top, bottom and leading edge (off) or
 * trailing edge (on), whatever `--spacing` is. The /create theme builder sets `--spacing`
 * between 3px and 5px, so these cases go a little beyond that on both sides.
 */

const SPACINGS_PX = [3, 4, 4.8, 6];

const PATHS = [
  // Motion is a dev dependency of this package. With no reduced-motion preference the thumb is
  // swapped for a `motion.span` after mount and moves with a spring.
  { path: "Motion spring", reducedMotion: false },
  // With `prefers-reduced-motion: reduce` the thumb keeps the CSS translate classes. This is the
  // same render that ships when Motion is not installed (the transition is off, the geometry is not).
  { path: "CSS fallback", reducedMotion: true },
] as const;

const SIZES = [
  { size: "default size", root: undefined, thumb: undefined },
  // A resized switch stays correct while the track's inner width is twice the thumb's.
  { size: "h-6 w-11 track with size-5 thumb", root: "h-6 w-11", thumb: "size-5" },
] as const;

const STARTS = [
  { start: "unchecked", defaultChecked: false },
  { start: "checked", defaultChecked: true },
] as const;

type State = "unchecked" | "checked";

/** `expect.closeTo` digits: |actual − expected| < 0.05px. Chromium lays out in 1/64px units. */
const PRECISION = 1;

function expectRestingAt(insets: Insets, state: State, gap: number) {
  const atGap = expect.closeTo(gap, PRECISION);
  const anyDistance = expect.any(Number);
  expect(insets).toEqual({
    top: atGap,
    bottom: atGap,
    left: state === "unchecked" ? atGap : anyDistance,
    right: state === "checked" ? atGap : anyDistance,
  });
  // The far side is open track, never less than the gap: the thumb did not overshoot or escape.
  expect(Math.min(insets.left, insets.right)).toBeGreaterThan(gap - 0.05);
}

type GeometryCase = {
  spacing: number;
  reducedMotion: boolean;
  defaultChecked: boolean;
  root?: string;
  thumb?: string;
};

async function expectThumbGeometry({
  spacing,
  reducedMotion,
  defaultChecked,
  root,
  thumb,
}: GeometryCase) {
  // `p-0.5` on the track: half a spacing unit.
  const gap = spacing / 2;
  const { getByRole, getByTestId } = render(
    <div style={{ "--spacing": `${spacing}px`, padding: 40 } as CSSProperties}>
      <Switch.Root aria-label="Geometry" defaultChecked={defaultChecked} className={root}>
        <Switch.Thumb data-testid="thumb" className={thumb} />
      </Switch.Root>
    </div>,
  );
  const track = getByRole("switch");
  // The Motion path replaces the thumb element once Motion loads, so always query it.
  const isCssThumb = () => getByTestId("thumb").classList.contains("micro-interactions");
  const expectThumbRestsAt = async (state: State) => {
    expect(track.getAttribute("aria-checked")).toBe(String(state === "checked"));
    const insets = await waitForStable(() => insetsWithin(track, getByTestId("thumb")));
    expectRestingAt(insets, state, gap);
  };

  await expect.poll(isCssThumb, { timeout: 5000 }).toBe(reducedMotion);

  const start: State = defaultChecked ? "checked" : "unchecked";
  await expectThumbRestsAt(start);
  await userEvent.click(track);
  await expectThumbRestsAt(defaultChecked ? "unchecked" : "checked");
  await userEvent.click(track);
  await expectThumbRestsAt(start);

  expect(isCssThumb()).toBe(reducedMotion);
}

describe.each(PATHS)("Switch thumb geometry, $path", ({ reducedMotion }) => {
  beforeAll(() =>
    commands.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" }),
  );
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

  describe.each(SIZES)("$size", ({ root, thumb }) => {
    describe.each(STARTS)("starting $start", ({ defaultChecked }) => {
      it.each(SPACINGS_PX)("rests one gap from the edges at --spacing: %spx", (spacing) =>
        expectThumbGeometry({ spacing, reducedMotion, defaultChecked, root, thumb }),
      );
    });
  });
});

// Forced-colors mode (e.g. Windows contrast themes) draws the track edge and the thumb with
// system colours. The thumb must rest in the same places there.
describe.each(PATHS)("Switch thumb geometry in forced-colors mode, $path", ({ reducedMotion }) => {
  beforeAll(() =>
    commands.emulateMedia({
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
      forcedColors: "active",
    }),
  );
  afterAll(() => commands.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" }));

  it.each(SPACINGS_PX)("rests one gap from the edges at --spacing: %spx", (spacing) =>
    expectThumbGeometry({ spacing, reducedMotion, defaultChecked: false }),
  );
});
