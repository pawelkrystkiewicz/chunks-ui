import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import {
  describePopupCssPath,
  eachPaintedFrame,
  emulateReducedMotion,
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
  MOTION_PATHS,
  renderFixture,
  renderPage,
  waitForStable,
} from "../../VisualTest.utils";
import { Select } from "./index";

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
];

const closedSelect = (open?: boolean, alignItemWithTrigger?: boolean) => (
  <div style={{ width: 200 }}>
    <Select.Root defaultValue="apple" open={open}>
      <Select.Trigger aria-label="Fruit">
        <Select.Value />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={alignItemWithTrigger}>
          <Select.Popup data-testid="popup">
            {fruits.map((f) => (
              <Select.Item key={f.value} value={f.value}>
                <Select.ItemIndicator />
                <Select.ItemText>{f.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>
);

describe("Select", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(closedSelect());
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the trigger. A focused trigger
  // makes Base UI mount the popup in a portal, hidden and 0 × 0, a moment later: wait for it, so
  // the page is settled, and screenshot by test id, as the fixture's CSS path is ambiguous then.
  it("trigger focus-visible", async () => {
    const { getByRole } = await renderFixture(closedSelect());
    const trigger = getByRole("combobox");
    focusVisible(trigger);
    await expect.poll(() => document.querySelectorAll("[data-base-ui-portal]").length).toBe(1);
    await expect(page.getByTestId("fixture")).toMatchScreenshot();
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue="banana" defaultOpen>
          <Select.Trigger>
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {fruits.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    <Select.ItemIndicator />
                    <Select.ItemText>{f.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>,
    );
    await expect(body).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on a disabled trigger", () => {
    const { getByRole } = render(
      <Select.Root defaultValue="apple" disabled>
        <Select.Trigger aria-label="Fruit">
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
      </Select.Root>,
    );
    expectNotAllowed(getByRole("combobox"));
  });
});

// Below its trigger: aligned over it, the popup fades without a scale (below)
describePopupCssPath("Select.Popup", (open) => closedSelect(open, false));

/** The rendered width over the layout width: 1 while nothing scales `el` */
const renderedScale = (el: Element) =>
  Math.round(
    (el.getBoundingClientRect().width / Number.parseFloat(getComputedStyle(el).width)) * 1000,
  ) / 1000;

/** The popup's side, rendered scale and opacity, once a painted frame while it is mounted */
const framesOf = async (popup: HTMLElement) => {
  const frames = await eachPaintedFrame(
    () =>
      popup.isConnected && {
        side: popup.getAttribute("data-side"),
        scale: renderedScale(popup),
        opacity: Number(getComputedStyle(popup).opacity),
      },
    40,
  );
  return frames.filter((frame) => frame !== false);
};

/**
 * Resolves once the popup is at rest and Motion has run its last frame for the entry, as when a
 * user closes it. Motion runs a frame more after an animation ends, and `getAnimations()` does not
 * see the scale, which Motion animates in JS.
 */
const settled = async (popup: HTMLElement) => {
  await expect.poll(() => popup.getAnimations()).toEqual([]);
  await waitForStable(() => renderedScale(popup));
};

// Aligned over its trigger (Base UI's default `alignItemWithTrigger`, `data-side="none"`), the
// popup lands with the selected item over the trigger's value, as Base UI's own reference styles
// assume: it fades in place at full size, on both paths
describe.each(MOTION_PATHS)("Select.Popup aligned with its trigger, $path", ({ withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(async () => {
    await emulateReducedMotion(true);
    await enterMotionPath(true);
  });

  // Clear of the page's top edge, where Base UI gives up the alignment
  const aligned = (open: boolean) => <div style={{ padding: 40 }}>{closedSelect(open)}</div>;

  it("opens without a scale", async () => {
    const { rerender, getByTestId } = render(aligned(false));
    rerender(aligned(true));
    const frames = await framesOf(getByTestId("popup"));
    expect(new Set(frames.map(({ side }) => side))).toEqual(new Set(["none"]));
    expect(frames.map(({ scale }) => scale)).toEqual(frames.map(() => 1));
    // The frames cover the entry: the popup fades in over them
    expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  });

  // Closed once it has faded in, while the spring's tail still runs and once at rest. On the Motion
  // path the exit starts as the popup closes: Base UI looks for it on the next frame, before
  // Motion's own frame, and unmounts a popup without one (#521)
  it.each([
    { when: "as it settles", atRest: false },
    { when: "at rest", atRest: true },
  ])("closes without a scale, $when", async ({ atRest }) => {
    const { rerender, getByTestId } = render(aligned(true));
    const popup = getByTestId("popup");
    await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
    if (atRest) await settled(popup);
    rerender(aligned(false));
    const frames = await framesOf(popup);
    expect(new Set(frames.map(({ side }) => side))).toEqual(new Set(["none"]));
    expect(frames.map(({ scale }) => scale)).toEqual(frames.map(() => 1));
    // The frames cover the exit: the popup fades out over them
    expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  });
});

// Below its trigger the popup scales as it fades out. On the Motion path the scale is a JS
// animation, which Base UI does not see: the fade alone keeps the popup mounted through the scale
describe("Select.Popup below its trigger, Motion", () => {
  beforeAll(() => enterMotionPath(true));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  const below = (open: boolean) => <div style={{ padding: 40 }}>{closedSelect(open, false)}</div>;

  it("closes with a scale, at rest", async () => {
    const { rerender, getByTestId } = render(below(true));
    const popup = getByTestId("popup");
    await settled(popup);
    rerender(below(false));
    const frames = await framesOf(popup);
    expect(frames.some(({ scale, opacity }) => scale < 1 && opacity > 0 && opacity < 1)).toBe(true);
  });
});
