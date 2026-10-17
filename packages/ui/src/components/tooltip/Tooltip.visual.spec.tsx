import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import {
  eachPaintedFrame,
  emulateReducedMotion,
  enterMotionPath,
  MOTION_PATHS,
  renderPage,
  waitForStable,
} from "../../VisualTest.utils";
import { Button } from "../button";
import { Tooltip } from "./index";

describe("Tooltip", () => {
  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 80, display: "flex", justifyContent: "center" }}>
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger render={<Button variant="outlined" />}>Hover me</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Tooltip.Arrow />
                  Tooltip content
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });
});

const NAMES = ["A", "B"] as const;

const tooltips = (names: readonly string[]) => (
  <div style={{ padding: 80, display: "flex", gap: 40, justifyContent: "center" }}>
    {names.map((name) => (
      <Tooltip.Root key={name}>
        <Tooltip.Trigger render={<Button variant="outlined" />}>{name}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid={`popup-${name}`}>Tooltip {name}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ))}
  </div>
);

const group = <Tooltip.Provider>{tooltips(NAMES)}</Tooltip.Provider>;

const trigger = (name: string) => screen.getByRole("button", { name });

/** The popup's opacity and scale (painted width over layout width, to 3 places), or null */
const poseOf = (name: string) => {
  const popup = document.querySelector<HTMLElement>(`[data-testid="popup-${name}"]`);
  if (!popup) return null;
  const { opacity, width } = getComputedStyle(popup);
  const scale = popup.getBoundingClientRect().width / Number.parseFloat(width);
  return { opacity: Number(opacity), scale: Number(scale.toFixed(3)) };
};

/** A's and B's poses in each frame painted after `action`, from the first frame that shows `name` */
async function posesAfter(name: "A" | "B", action: () => Promise<void>) {
  const frames = eachPaintedFrame(() => ({ A: poseOf("A"), B: poseOf("B") }), 40);
  await action();
  return (await frames).filter((poses) => poses[name] !== null);
}

/** Hovers `name`'s trigger and waits for its popup to finish opening */
async function openAndSettle(name: "A" | "B") {
  await userEvent.hover(trigger(name));
  const popup = await screen.findByTestId(`popup-${name}`);
  await waitForStable(() => getComputedStyle(popup).opacity);
}

describe.each(MOTION_PATHS)("Tooltip animation, $path", ({ withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(async () => {
    await emulateReducedMotion(true);
    await enterMotionPath(true);
  });

  it("animates a tooltip that opens after the delay", async () => {
    render(group);
    const [first] = await posesAfter("A", () => userEvent.hover(trigger("A")));
    expect(first?.A?.opacity).toBeLessThan(1);
    expect(first?.A?.scale).toBeLessThan(1);
  });

  // Base UI marks a popup opened by keyboard focus `data-instant="focus"`; only the swap below skips
  it("animates a tooltip that opens on keyboard focus", async () => {
    render(tooltips(["A"]));
    const [first] = await posesAfter("A", () => userEvent.tab());
    expect(first?.A?.opacity).toBeLessThan(1);
    expect(first?.A?.scale).toBeLessThan(1);
  });

  // Inside a Provider, a tooltip that opens while another is open skips its delay, and Base UI
  // marks both popups `data-instant="delay"`: the one opening and the one it replaces.
  it("swaps to the next tooltip with no animation", async () => {
    render(group);
    await openAndSettle("A");

    const [first] = await posesAfter("B", () => userEvent.hover(trigger("B")));
    // B paints in full from its first frame, and A is already hidden or gone in it
    expect(first?.B).toEqual({ opacity: 1, scale: 1 });
    expect(first?.A?.opacity ?? 0).toBe(0);
  });

  // Only the swap skips the animation: the tooltip that opened at once fades out as usual
  it("animates the close of a tooltip that opened at once", async () => {
    render(group);
    await openAndSettle("A");
    await openAndSettle("B");

    const poses = await posesAfter("B", () => userEvent.unhover(trigger("B")));
    const opacities = poses.map(({ B }) => B?.opacity);
    expect(opacities.some((opacity = 0) => opacity > 0 && opacity < 1)).toBe(true);
  });
});
