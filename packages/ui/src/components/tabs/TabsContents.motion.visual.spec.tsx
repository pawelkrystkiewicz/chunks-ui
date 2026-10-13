import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  eachPaintedFrame,
  enterMotionPath,
  MOTION_PATHS,
  waitForStable,
} from "../../VisualTest.utils";
import { Button } from "../button";
import { Tabs } from "./index";

type Rgb = [number, number, number];
type Point = { x: number; y: number };

/** A CSS colour (any syntax the page computes, `oklch()` included) as sRGB, through a canvas */
function rgbOf(color: string): Rgb {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** The colour the page paints at each point, in viewport px, read from a screenshot */
async function paintedAt(points: Point[]): Promise<Rgb[]> {
  const base64 = await page.screenshot({ save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas context");
  ctx.drawImage(image, 0, 0);
  // One image px per CSS px, as the runner window fits the page: scaled, a thin line blurs into its
  // neighbours. The screenshot covers the whole viewport, a scrollbar included.
  expect(image.naturalWidth).toBe(window.innerWidth);
  return points.map(({ x, y }) => {
    const [r = 0, g = 0, b = 0] = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    return [r, g, b];
  });
}

// The page is 414 × 600, kept as it was: the existing baselines use this size
beforeAll(() => page.viewport(414, 600));

const close = (a: Rgb, b: Rgb) => a.every((channel, i) => Math.abs(channel - (b[i] ?? 0)) <= 2);

/** Waits until Tabs.Contents has settled on the path: Motion sets its height inline */
async function settled(contents: HTMLElement, withMotion: boolean) {
  await expect.poll(() => contents.style.height !== "").toBe(withMotion);
  await waitForStable(() => {
    const track = contents.firstElementChild as HTMLElement;
    return `${contents.getBoundingClientRect().height}|${track.getBoundingClientRect().left}`;
  });
}

describe.each(MOTION_PATHS)("Tabs.Contents, $path", ({ withMotion }) => {
  // Button's ring is a 2px outline 2px outside it. A full-width button in the panel puts the
  // ring 2–4px outside Tabs.Contents on every side.
  it("shows the whole focus ring of content at its edges", async () => {
    await enterMotionPath(withMotion);
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Tabs.Root defaultValue="a">
          <Tabs.Contents data-testid="contents">
            <Tabs.Content value="a">
              <Button className="w-full">Edge to edge</Button>
            </Tabs.Content>
            <Tabs.Content value="b">Panel B</Tabs.Content>
          </Tabs.Contents>
        </Tabs.Root>
      </div>,
    );
    await settled(getByTestId("contents"), withMotion);

    // With the keyboard, so the button matches :focus-visible and shows its ring
    const button = getByRole("button", { name: "Edge to edge" });
    (document.activeElement as HTMLElement | null)?.blur();
    for (let step = 0; step < 5 && document.activeElement !== button; step++) {
      await userEvent.tab();
    }
    expect(button.matches(":focus-visible")).toBe(true);
    // The ring fades in with the button's transition
    await Promise.all(button.getAnimations().map((animation) => animation.finished));

    const ring = rgbOf(getComputedStyle(button).outlineColor);
    const box = button.getBoundingClientRect();
    const midX = (box.left + box.right) / 2;
    const midY = (box.top + box.bottom) / 2;
    // The middle of the ring on each side
    const sides = { left: -3, right: 3, top: -3, bottom: 3 };
    const painted = await paintedAt([
      { x: box.left + sides.left, y: midY },
      { x: box.right + sides.right, y: midY },
      { x: midX, y: box.top + sides.top },
      { x: midX, y: box.bottom + sides.bottom },
    ]);
    expect(
      painted.map((rgb) => close(rgb, ring)),
      JSON.stringify({ ring, painted }),
    ).toEqual([true, true, true, true]);
  });
});

describe("Tabs.Contents with Motion, beside the active panel", () => {
  // The panels on either side fill their whole box with colour. Room left for focus rings
  // around the active panel must not show any of them.
  it("shows none of the panels next to it", async () => {
    await enterMotionPath(true);
    const block = <div className="h-20 bg-destructive" />;
    const { getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Tabs.Root defaultValue="b">
          <Tabs.Contents data-testid="contents">
            <Tabs.Content value="a">{block}</Tabs.Content>
            <Tabs.Content value="b">
              <p className="h-20">Panel B</p>
            </Tabs.Content>
            <Tabs.Content value="c">{block}</Tabs.Content>
          </Tabs.Contents>
        </Tabs.Root>
      </div>,
    );
    const contents = getByTestId("contents");
    await settled(contents, true);

    const box = contents.getBoundingClientRect();
    const midY = (box.top + box.bottom) / 2;
    const [background, ...beside] = await paintedAt([
      { x: box.left - 30, y: midY },
      ...[1, 2, 3, 4].flatMap((px) => [
        { x: box.left - px, y: midY },
        { x: box.right + px - 1, y: midY },
      ]),
    ]);
    expect(background).toBeDefined();
    for (const rgb of beside) expect(rgb).toEqual(background);
  });
});

describe("Tabs.Contents with Motion, under StrictMode", () => {
  // StrictMode (Next.js turns it on in development) runs effects, cleans them up and runs them
  // again. The re-run must jump to the default panel like the first run, not spring there from
  // the first one. Panel A is taller, so a height springing from the tallest panel shows too.
  it("starts at rest on a default panel other than the first", async () => {
    await enterMotionPath(true);
    const { getByTestId } = render(
      <StrictMode>
        <div style={{ padding: 40 }}>
          <Tabs.Root defaultValue="c">
            <Tabs.Contents data-testid="contents">
              <Tabs.Content value="a">
                <div className="h-40">Panel A</div>
              </Tabs.Content>
              <Tabs.Content value="b">Panel B</Tabs.Content>
              <Tabs.Content value="c" data-testid="c">
                <div className="h-10">Panel C</div>
              </Tabs.Content>
            </Tabs.Contents>
          </Tabs.Root>
        </div>
      </StrictMode>,
    );
    const contents = getByTestId("contents");
    const panel = getByTestId("c");
    const place = () => {
      const box = contents.getBoundingClientRect();
      return {
        offset: Math.round(panel.getBoundingClientRect().left - box.left),
        height: Math.round(box.height),
      };
    };
    const frames = await eachPaintedFrame(place, 20);
    // The CSS fallback also gives offset 0 and height 40, so check Motion owns the inline height
    expect(contents.style.height).not.toBe("");
    // Panel C where the container is, and the 40px of its h-10, from the first frame
    expect(frames).toEqual(frames.map(() => ({ offset: 0, height: 40 })));
  });
});

describe("Tabs.Contents layout", () => {
  // The Motion path's flex track keeps a panel child's margins inside Tabs.Contents. Without
  // Motion they must stay inside too, or they collapse with the margin above, and the content
  // moves when Motion loads.
  it("keeps a panel child's margins inside it, with and without Motion", async () => {
    const layout: Record<string, { offset: number; height: number }> = {};
    for (const { path, withMotion } of MOTION_PATHS) {
      await enterMotionPath(withMotion);
      const { getByTestId, unmount } = render(
        <div style={{ padding: 40 }}>
          <Tabs.Root defaultValue="a">
            <div data-testid="above" style={{ height: 10, marginBottom: 8 }} />
            <Tabs.Contents data-testid="contents">
              <Tabs.Content value="a">
                <p data-testid="child" style={{ margin: "16px 0", height: 20 }}>
                  Panel A
                </p>
              </Tabs.Content>
              <Tabs.Content value="b">Panel B</Tabs.Content>
            </Tabs.Contents>
          </Tabs.Root>
        </div>,
      );
      const contents = getByTestId("contents");
      await settled(contents, withMotion);
      layout[path] = {
        offset:
          getByTestId("child").getBoundingClientRect().top -
          getByTestId("above").getBoundingClientRect().bottom,
        height: contents.getBoundingClientRect().height,
      };
      unmount();
    }
    // 8px below the element above, then the child's 16px; 16px + 20px + 16px tall
    expect(layout).toEqual({
      Motion: { offset: 24, height: 52 },
      "CSS fallback": { offset: 24, height: 52 },
    });
  });
});
