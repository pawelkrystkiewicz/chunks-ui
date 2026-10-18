import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import {
  contentSpan,
  describePopupCssPath,
  emulateReducedMotion,
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
  framesOf,
  inlineSpan,
  insetsWithin,
  MOTION_PATHS,
  renderFixture,
  renderPage,
  SETTLE_TIMEOUT_MS,
  settled,
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

  // A badge beside the value keeps its width on one line, and the value takes only the free space
  // and truncates first (#546). Before, the value's flex-basis was its full text width, so a long
  // value and the badge shrank in proportion and the badge's two words wrapped.
  it.each([
    { length: "short", fruit: "Fig", truncated: false },
    { length: "long", fruit: "Dragon fruit from the far end of the orchard", truncated: true },
  ])("keeps a badge beside a $length value on one line, at full width", ({ fruit, truncated }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue={fruit}>
          <Select.Trigger aria-label="Fruit" style={{ width: 200 }}>
            <Select.Value data-testid="value" />
            <span data-testid="badge" className="ms-2">
              Pro plan
            </span>
            <Select.Icon data-testid="icon" />
          </Select.Trigger>
        </Select.Root>
        {/* The badge's one line at its own width, in the trigger's font */}
        <div data-testid="reference" className="w-max text-sm">
          Pro plan
        </div>
      </div>,
    );
    const trigger = getByRole("combobox");
    const content = contentSpan(trigger, "ltr");
    const value = getByTestId("value");
    const badge = getByTestId("badge");
    const icon = inlineSpan(getByTestId("icon"), "ltr");
    const reference = getByTestId("reference").getBoundingClientRect();
    expect(badge.getBoundingClientRect().width).toBeCloseTo(reference.width, 1);
    // The text keeps to the start of the value's box, which the trigger's <button> would centre
    const text = document.createRange();
    text.selectNodeContents(value);
    expect(inlineSpan(text, "ltr").start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, "ltr").end).toBeLessThanOrEqual(inlineSpan(badge, "ltr").start);
    expect(inlineSpan(badge, "ltr").end).toBeLessThanOrEqual(icon.start);
    expect(icon.end).toBeCloseTo(content.end, 1);
    expect(value.scrollWidth > value.clientWidth).toBe(truncated);
  });

  // `flex-initial` brings back the earlier sizing (#546): the value still shrinks and truncates
  it("keeps a long value cut inside a 140px trigger with flex-initial on Select.Value", () => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue="Dragon fruit from the far end of the orchard">
          <Select.Trigger aria-label="Fruit" style={{ width: 140 }}>
            <Select.Value className="flex-initial" data-testid="value" />
            <Select.Icon data-testid="icon" />
          </Select.Trigger>
        </Select.Root>
      </div>,
    );
    const content = contentSpan(getByRole("combobox"), "ltr");
    const value = getByTestId("value");
    const icon = inlineSpan(getByTestId("icon"), "ltr");
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    expect(inlineSpan(value, "ltr").end).toBeLessThanOrEqual(icon.start);
    expect(icon.end).toBeCloseTo(content.end, 1);
  });

  // The value's one line must not widen the trigger past its container: beside a button in a
  // flex row it shrinks, and sized by its value (`w-auto`) it stops at the container's width
  it.each([
    { layout: "beside a button in a 200px flex row", width: 200, row: true, trigger: undefined },
    { layout: "sized by its value in a 140px box", width: 140, row: false, trigger: "w-auto" },
  ])("keeps a trigger $layout inside it, with the value cut", ({ width, row, trigger }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <div data-testid="box" className={row ? "flex gap-2" : undefined} style={{ width }}>
          <Select.Root defaultValue="Dragon fruit from the far end of the orchard">
            <Select.Trigger aria-label="Fruit" className={trigger}>
              <Select.Value data-testid="value" />
              <Select.Icon />
            </Select.Trigger>
          </Select.Root>
          {row && (
            <button type="button" style={{ width: 60 }}>
              Go
            </button>
          )}
        </div>
      </div>,
    );
    const box = getByTestId("box");
    expect(insetsWithin(box, getByRole("combobox")).right).toBeGreaterThanOrEqual(0);
    if (row) expect(insetsWithin(box, getByRole("button")).right).toBeGreaterThanOrEqual(0);
    const value = getByTestId("value");
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
  });
});

// Below its trigger: aligned over it, the popup fades without a scale (below)
describePopupCssPath("Select.Popup", (open) => closedSelect(open, false));

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

  // Closed during the spring's tail and at rest; on the Motion path see `createPopupRenderer` (#521)
  it.each([
    { when: "as it settles", atRest: false },
    { when: "at rest", atRest: true },
  ])("closes without a scale, $when", async ({ atRest }) => {
    const { rerender, getByTestId } = render(aligned(true));
    const popup = getByTestId("popup");
    await expect
      .poll(() => getComputedStyle(popup).opacity, { timeout: SETTLE_TIMEOUT_MS })
      .toBe("1");
    if (atRest) await settled(popup);
    rerender(aligned(false));
    const frames = await framesOf(popup);
    expect(new Set(frames.map(({ side }) => side))).toEqual(new Set(["none"]));
    expect(frames.map(({ scale }) => scale)).toEqual(frames.map(() => 1));
    // The frames cover the exit: the popup fades out over them
    expect(frames.some(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
  });
});

// Below its trigger the scale is a JS animation: only the fade keeps the popup mounted through it
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
