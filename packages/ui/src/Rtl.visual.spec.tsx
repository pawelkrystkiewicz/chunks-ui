import { DirectionProvider } from "@base-ui/react/direction-provider";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { Switch } from "./components/switch";
import { reloadMotion } from "./lib/use-motion";
import { eachPaintedFrame, insetsWithin, waitForStable } from "./VisualTest.utils";

/*
 * Parts that sit at the start or the end of a line must swap sides right to left. Most cases run
 * in both directions, and state their expectations along the inline axis, so the same assertion
 * holds in LTR and mirrors in RTL.
 */

type Dir = "ltr" | "rtl";
const DIRS: Dir[] = ["ltr", "rtl"];

/** Renders `ui` the way an app sets a direction: `dir` on <html>, which portalled popups inherit */
function renderIn(dir: Dir, ui: ReactNode) {
  document.documentElement.dir = dir;
  // Base UI needs the direction too, for keyboard navigation and logical alignment
  return render(
    <DirectionProvider direction={dir}>
      <div style={{ padding: 40 }}>{ui}</div>
    </DirectionProvider>,
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

const px = (value: string) => Number.parseFloat(value);

/** Distances from `outer`'s inline-start and inline-end edges to the same edges of `inner` */
function inlineInsets(outer: Element, inner: Element, dir: Dir) {
  const { left, right } = insetsWithin(outer, inner);
  return dir === "ltr" ? { start: left, end: right } : { start: right, end: left };
}

/** Whole-pixel tolerance for edges that should line up: Chromium lays out in 1/64px units */
const near = (value: number) => expect.closeTo(value, 1);

describe("Switch in both directions", () => {
  const PATHS = [
    { path: "Motion spring", reducedMotion: false },
    // The same render ships when Motion is not installed
    { path: "CSS fallback", reducedMotion: true },
  ] as const;

  type State = "unchecked" | "checked";

  function renderSwitch(dir: Dir, defaultChecked: boolean) {
    const { getByRole, getByTestId } = renderIn(
      dir,
      <Switch.Root aria-label="Wi-Fi" defaultChecked={defaultChecked}>
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    );
    const track = getByRole("switch");
    const thumb = () => getByTestId("thumb");
    const isCssThumb = () => thumb().classList.contains("micro-interactions");
    // Off, the thumb rests one padding away from the inline start; on, from the inline end.
    // The far side is open track, so the thumb never leaves it.
    const expectRestsAt = async (state: State, currentDir: Dir = dir) => {
      expect(track.getAttribute("aria-checked")).toBe(String(state === "checked"));
      const gap = px(getComputedStyle(track).paddingInlineStart);
      const insets = await waitForStable(() => inlineInsets(track, thumb(), currentDir));
      expect(insets).toEqual({
        start: state === "unchecked" ? near(gap) : expect.any(Number),
        end: state === "checked" ? near(gap) : expect.any(Number),
      });
      expect(Math.min(insets.start, insets.end)).toBeGreaterThan(gap - 0.05);
    };
    return { track, thumb, isCssThumb, expectRestsAt };
  }

  describe.each(PATHS)("$path", ({ reducedMotion }) => {
    beforeAll(() =>
      commands.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" }),
    );
    afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    it.each(
      DIRS.flatMap((dir) => [
        { dir, start: "unchecked" as const },
        { dir, start: "checked" as const },
      ]),
    )(
      "rests off at the inline start and on at the inline end, $dir, starting $start",
      async ({ dir, start }) => {
        const { track, isCssThumb, expectRestsAt } = renderSwitch(dir, start === "checked");
        await expect.poll(isCssThumb, { timeout: 5000 }).toBe(reducedMotion);
        const other: State = start === "checked" ? "unchecked" : "checked";

        await expectRestsAt(start);
        await userEvent.click(track);
        await expectRestsAt(other);
        await userEvent.click(track);
        await expectRestsAt(start);
        expect(isCssThumb()).toBe(reducedMotion);
      },
    );

    it("moves toward the new inline end after the direction changes", async () => {
      const { track, isCssThumb, expectRestsAt } = renderSwitch("ltr", false);
      await expect.poll(isCssThumb, { timeout: 5000 }).toBe(reducedMotion);
      await expectRestsAt("unchecked");

      document.documentElement.dir = "rtl";
      await userEvent.click(track);
      await expectRestsAt("checked", "rtl");
    });
  });

  describe("Motion spring, from the first frame", () => {
    beforeAll(() => commands.emulateMedia({ reducedMotion: "no-preference" }));
    afterAll(() => commands.emulateMedia({ reducedMotion: "reduce" }));

    // Mounted after Motion loaded, Motion drives the thumb from its first render. It must jump
    // to its place there, not spring there from the LTR side.
    it.each(DIRS)("shows a checked thumb at the inline end on every frame, %s", async (dir) => {
      await reloadMotion();
      const { thumb, track, isCssThumb } = renderSwitch(dir, true);
      expect(isCssThumb()).toBe(false);
      const gap = px(getComputedStyle(track).paddingInlineStart);
      const frames = await eachPaintedFrame(() => inlineInsets(track, thumb(), dir).end, 5);
      expect(frames).toEqual(frames.map(() => near(gap)));
    });

    // A switch on the page before Motion loads renders the CSS fallback, then Motion takes over
    // where the thumb rests
    it("keeps a checked thumb at the inline end when Motion arrives after mount, rtl", async () => {
      let arrive: (value?: unknown) => void = () => {};
      const loaded = reloadMotion(
        new Promise((resolve) => {
          arrive = resolve;
        }),
      );
      const { track, isCssThumb, expectRestsAt } = renderSwitch("rtl", true);
      expect(isCssThumb()).toBe(true);
      await expectRestsAt("checked");

      arrive();
      await loaded;
      await expect.poll(isCssThumb, { timeout: 5000 }).toBe(false);
      await expectRestsAt("checked");
      await userEvent.click(track);
      await expectRestsAt("unchecked");
      await userEvent.click(track);
      await expectRestsAt("checked");
    });
  });
});
