import { render } from "@testing-library/react";
import { createRef } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  contentSpan,
  describeDirs,
  describeExitPaths,
  describePopupCssPath,
  emulateReducedMotion,
  enterMotionPath,
  exited,
  expectNotAllowed,
  focusVisible,
  framesOf,
  inlineSpan,
  insetsWithin,
  isShown,
  MOTION_PATHS,
  recordTabDuringExit,
  renderFixture,
  renderPage,
  settled,
  tookFocus,
} from "../../VisualTest.utils";
import { FIELD_TEXT_SIZE } from "../shared";
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

  // 60px above the trigger: the popup lands with Banana over the trigger's value, and Apple's row
  // above it needs the room, or Base UI scrolls the list to keep the alignment
  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: "60px 40px 40px" }}>
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

  // #706. A modal select puts Base UI's invisible backdrop over the page: a press outside closes
  // the popup and reaches nothing under it, an element with a z-index of its own included.
  it("closes on a press on a sticky header, which the press does not reach", async () => {
    const onClick = vi.fn();
    const { getByRole, getByTestId } = render(
      <>
        <header className="sticky top-0 z-10">
          <button type="button" onClick={onClick}>
            Header
          </button>
        </header>
        <div style={{ padding: 40 }}>{closedSelect()}</div>
      </>,
    );
    // Found before the popup opens, as Base UI hides the page from the accessibility tree then
    const header = page.elementLocator(getByRole("button", { name: "Header" }));
    await userEvent.click(getByRole("combobox", { name: "Fruit" }));
    const popup = getByTestId("popup");
    await settled(popup);
    // Forced: Playwright would otherwise wait for the button to be the element under the pointer
    await header.click({ force: true });
    expect(onClick).not.toHaveBeenCalled();
    await exited(popup, { stillClosing: isShown });
  });

  // The backdrop takes the `z-dropdowns` layer only beside a positioner on it: one moved lower by
  // its className keeps the popup above the backdrop
  it("takes a press on an item in a positioner below z-dropdowns", async () => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Select.Root defaultValue="apple">
          <Select.Trigger aria-label="Fruit">
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className="z-10">
              <Select.Popup data-testid="popup">
                {fruits.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    <Select.ItemText>{f.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>,
    );
    const trigger = getByRole("combobox", { name: "Fruit" });
    await userEvent.click(trigger);
    await settled(getByTestId("popup"));
    // Forced, as above: on the backdrop, the press would close the popup and pick nothing
    await page.getByRole("option", { name: "Cherry" }).click({ force: true });
    // The value as given: the Root has no `items` to label it with
    await expect.element(trigger).toHaveTextContent("cherry");
  });
});

// Each case runs in both directions: the value's `text-start` and the chevron's `ms-auto` follow
// the direction, and the value, the badge and the chevron keep their inline order.
describeDirs("Select.Value in a trigger, %s", (dir) => {
  // Three of the cases below in one picture: a short and a long value in a 140px trigger, and a long
  // value beside a badge in a 200px one. In RTL the value starts at the right edge and its ellipsis,
  // the badge and the chevron sit to its left. A Latin value shows its last words there: its text
  // keeps to the right edge, so its first words are what overflows
  it("shows a short value, a cut value and a badge before the chevron", async () => {
    const rows = [
      { fruit: "Fig", width: 140 },
      { fruit: "Dragon fruit from the far end of the orchard", width: 140 },
      { fruit: "Dragon fruit from the far end of the orchard", width: 200, badge: "Pro plan" },
    ];
    const { fixture } = await renderFixture(
      <div className="flex flex-col items-start gap-2">
        {rows.map(({ fruit, width, badge }) => (
          <Select.Root key={`${width} ${fruit}`} defaultValue={fruit}>
            <Select.Trigger aria-label="Fruit" style={{ width }}>
              <Select.Value />
              {badge && <span className="ms-2">{badge}</span>}
              <Select.Icon />
            </Select.Trigger>
          </Select.Root>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
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
    const content = contentSpan(trigger, dir);
    const value = getByTestId("value");
    const icon = inlineSpan(getByTestId("icon"), dir);
    const { top, bottom } = insetsWithin(trigger, value);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(0);
    expect(inlineSpan(value, dir).start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, dir).end).toBeLessThanOrEqual(icon.start);
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
        <div data-testid="reference" className={`w-max ${FIELD_TEXT_SIZE}`}>
          Pro plan
        </div>
      </div>,
    );
    const trigger = getByRole("combobox");
    const content = contentSpan(trigger, dir);
    const value = getByTestId("value");
    const badge = getByTestId("badge");
    const icon = inlineSpan(getByTestId("icon"), dir);
    const reference = getByTestId("reference").getBoundingClientRect();
    expect(badge.getBoundingClientRect().width).toBeCloseTo(reference.width, 1);
    // The text keeps to the start of the value's box, which the trigger's <button> would centre
    const text = document.createRange();
    text.selectNodeContents(value);
    expect(inlineSpan(text, dir).start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, dir).end).toBeLessThanOrEqual(inlineSpan(badge, dir).start);
    expect(inlineSpan(badge, dir).end).toBeLessThanOrEqual(icon.start);
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
    const content = contentSpan(getByRole("combobox"), dir);
    const value = getByTestId("value");
    const icon = inlineSpan(getByTestId("icon"), dir);
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    expect(inlineSpan(value, dir).end).toBeLessThanOrEqual(icon.start);
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
    // An overflow would pass the box's inline end: its right edge in LTR, its left edge in RTL
    const box = inlineSpan(getByTestId("box"), dir);
    expect(inlineSpan(getByRole("combobox"), dir).end).toBeLessThanOrEqual(box.end);
    if (row) expect(inlineSpan(getByRole("button"), dir).end).toBeLessThanOrEqual(box.end);
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

// Base UI returns focus to the trigger only at the end of the exit, as it hides the popup (kept
// mounted once the trigger has had focus): a Tab during the exit went to a focus guard in the
// closing popup, then <body> (#633)
describeExitPaths("Select focus as the popup closes", (reduce) => {
  // Text fields around the trigger, as WebKit's Tab and click skip buttons
  const fixture = ({
    alignItemWithTrigger,
    modal,
    finalFocusBefore = false,
  }: {
    alignItemWithTrigger?: boolean;
    modal?: boolean;
    finalFocusBefore?: boolean;
  } = {}) => {
    const beforeRef = createRef<HTMLInputElement>();
    return (
      <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
        <input ref={beforeRef} aria-label="Before" />
        <Select.Root defaultValue="apple" modal={modal}>
          <Select.Trigger aria-label="Fruit">
            <Select.Value />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={alignItemWithTrigger}>
              <Select.Popup
                data-testid="popup"
                finalFocus={finalFocusBefore ? beforeRef : undefined}
              >
                {fruits.map((f) => (
                  <Select.Item key={f.value} value={f.value}>
                    <Select.ItemText>{f.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <input aria-label="After" />
      </div>
    );
  };

  const open = async (props?: Parameters<typeof fixture>[0]) => {
    const view = render(fixture(props));
    const trigger = view.getByRole("combobox", { name: "Fruit" });
    await userEvent.click(trigger);
    const popup = view.getByTestId("popup");
    await expect.poll(() => popup.contains(document.activeElement)).toBe(true);
    // Open at rest: closed during its entry, the CSS path's popup can leave at once
    await settled(popup);
    return {
      trigger,
      popup,
      before: view.getByRole("textbox", { name: "Before" }),
      after: view.getByRole("textbox", { name: "After" }),
    };
  };

  // Enter and Tab go in one call: with reduced motion the popup leaves a frame after the pick
  it.each([
    { alignment: "aligned with its trigger", alignItemWithTrigger: undefined },
    { alignment: "below its trigger", alignItemWithTrigger: false },
  ])(
    "moves a Tab pressed during the exit past the trigger, after a pick by Enter, $alignment",
    async ({ alignItemWithTrigger }) => {
      const { popup, after } = await open({ alignItemWithTrigger });
      await userEvent.keyboard("{ArrowDown}");
      const checkTab = recordTabDuringExit(popup, { reduce, stillClosing: isShown });
      await userEvent.keyboard("{Enter}{Tab}");
      checkTab();
      expect(document.activeElement).toBe(after);
      await exited(popup, { stillClosing: isShown });
      expect(document.activeElement).toBe(after);
    },
  );

  // A click and a key press are two calls, too far apart for the one frame of reduced motion
  it.skipIf(reduce)(
    "moves a Tab pressed during the exit past the trigger, after a pick by click",
    async () => {
      const { popup, after } = await open();
      const checkTab = recordTabDuringExit(popup, { reduce, stillClosing: isShown });
      await userEvent.click(page.getByRole("option", { name: "Cherry" }));
      await userEvent.keyboard("{Tab}");
      checkTab();
      expect(document.activeElement).toBe(after);
      await exited(popup, { stillClosing: isShown });
      expect(document.activeElement).toBe(after);
    },
  );

  // Motion and CSS only: reduced motion's one-frame exit adds nothing here
  it.skipIf(reduce)("moves focus to the trigger on Escape", async () => {
    const { popup, trigger } = await open();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await exited(popup, { stillClosing: isShown });
    expect(document.activeElement).toBe(trigger);
  });

  // Focus must not come back to the trigger, nor pass through it on the way. Not modal, so the
  // click reaches the field, not Base UI's backdrop.
  it("leaves focus where an outside click put it", async () => {
    const { popup, trigger, before } = await open({ alignItemWithTrigger: false, modal: false });
    const triggerFocused = tookFocus(trigger);
    await userEvent.click(before);
    expect(triggerFocused(), "the trigger took focus on the way").toBe(false);
    expect(document.activeElement).toBe(before);
    await exited(popup, { stillClosing: isShown });
    expect(document.activeElement).toBe(before);
  });

  // An element as `finalFocus` keeps Base UI's timing: focus moves there at the end of the exit,
  // as the popup hides
  it("moves focus only at the end of the exit, to an element passed as finalFocus", async () => {
    const { popup, trigger, before } = await open({ finalFocusBefore: true });
    const triggerFocused = tookFocus(trigger);
    await userEvent.keyboard("{Escape}");
    // Not as the exit starts. Reduced motion's exit of a frame may be over by now.
    if (!reduce) {
      expect(isShown(popup), "the popup is still closing").toBe(true);
      expect(document.activeElement).not.toBe(before);
    }
    await exited(popup, { stillClosing: isShown });
    expect(triggerFocused(), "the trigger took focus").toBe(false);
    expect(document.activeElement).toBe(before);
  });
});
