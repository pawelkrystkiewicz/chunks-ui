import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import {
  contentSpan,
  describePopupCssPath,
  eachPaintedFrame,
  emulateReducedMotion,
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
  inlineSpan,
  insetsWithin,
  MOTION_PATHS,
  renderFixture,
  renderPage,
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

  // A value wider than the trigger stays on one line and ends in an ellipsis before the chevron,
  // and the chevron keeps its size at the trigger's end, as beside a short value (#518). Before,
  // a long word ran past the trigger and pushed the chevron out, and several words wrapped.
  it.each([
    { length: "short", fruit: "Fig", truncated: false },
    { length: "long", fruit: "Dragon fruit from the far end of the orchard", truncated: true },
    { length: "one-word long", fruit: "Supercalifragilisticexpialidocious", truncated: true },
  ])("keeps a $length value and the chevron inside a 140px trigger", ({ fruit, truncated }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue={fruit}>
          <Select.Trigger aria-label="Fruit" style={{ width: 140 }}>
            <Select.Value data-testid="value" />
            <Select.Icon data-testid="icon" />
          </Select.Trigger>
        </Select.Root>
      </div>,
    );
    const trigger = getByRole("combobox");
    const content = contentSpan(trigger, "ltr");
    const value = getByTestId("value");
    const icon = inlineSpan(getByTestId("icon"), "ltr");
    const { top, bottom } = insetsWithin(trigger, value);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(0);
    expect(inlineSpan(value, "ltr").start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, "ltr").end).toBeLessThanOrEqual(icon.start);
    expect(icon.end).toBeCloseTo(content.end, 1);
    expect(icon.end - icon.start).toBe(16);
    // Cut at the value's box, with an ellipsis: the text is wider than what shows
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    expect(value.scrollWidth > value.clientWidth).toBe(truncated);
  });
});

// Below its trigger: aligned over it, the popup fades without a scale (below)
describePopupCssPath("Select.Popup", (open) => closedSelect(open, false));

/** The rendered width over the layout width: 1 while nothing scales `el` */
const renderedScale = (el: Element) =>
  Math.round(
    (el.getBoundingClientRect().width / Number.parseFloat(getComputedStyle(el).width)) * 1000,
  ) / 1000;

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

  it("opens without a scale", async () => {
    const { rerender, getByTestId } = render(aligned(false));
    rerender(aligned(true));
    const frames = await framesOf(getByTestId("popup"));
    expect(new Set(frames.map(({ side }) => side))).toEqual(new Set(["none"]));
    expect(frames.map(({ scale }) => scale)).toEqual(frames.map(() => 1));
    // The frames cover the entry: the popup fades in over them
    expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  });

  // On the Motion path a Select has no exit to watch: Base UI unmounts it on the frame after it
  // closes, before Motion starts the exit
  if (!withMotion) {
    it("closes without a scale", async () => {
      const { rerender, getByTestId } = render(aligned(true));
      const popup = getByTestId("popup");
      await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
      rerender(aligned(false));
      const frames = await framesOf(popup);
      expect(new Set(frames.map(({ side }) => side))).toEqual(new Set(["none"]));
      expect(frames.map(({ scale }) => scale)).toEqual(frames.map(() => 1));
      // The frames cover the exit: the popup fades out over them
      expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
    });
  }
});
