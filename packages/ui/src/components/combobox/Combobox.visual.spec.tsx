import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  boxOf,
  contentSpan,
  describePopupCssPath,
  emulateReducedMotion,
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
  inlineSpan,
  insetsWithin,
  MOTION_PATHS,
  renderFixture,
  renderPage,
  ringColor,
  waitForStable,
} from "../../VisualTest.utils";
import { Combobox, type ComboboxPositionerProps } from "./index";

const options = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
];

const popup = (positionerProps?: ComboboxPositionerProps) => (
  <Combobox.Portal>
    <Combobox.Positioner {...positionerProps}>
      <Combobox.Popup data-testid="popup">
        <Combobox.List>
          {(item: (typeof options)[number]) => (
            <Combobox.Item key={item.value} value={item}>
              <Combobox.ItemIndicator />
              {item.label}
            </Combobox.Item>
          )}
        </Combobox.List>
        <Combobox.Empty>No results found</Combobox.Empty>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
);

// Combobox.Empty reads the filtered `items` on Root: without them it counts no matches and
// shows its message under the items
const combobox = ({
  defaultOpen = false,
  open,
  positionerProps,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  positionerProps?: ComboboxPositionerProps;
} = {}) => (
  <Combobox.Root items={options} defaultOpen={defaultOpen} open={open}>
    <Combobox.Input placeholder="Search framework..." />
    {popup(positionerProps)}
  </Combobox.Root>
);

// The docs' multi-select: the Control draws the ring (`has-[:focus-visible]`) while the input
// inside it has focus, and turns the input's own ring off
// `open` starts the popup open, to measure it against the Control (`data-testid="control"`)
const chipsCombobox = ({
  open = false,
  placeholder = "Select framework...",
}: {
  open?: boolean;
  placeholder?: string;
} = {}) => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)} defaultOpen={open}>
    <Combobox.Control data-testid="control">
      <Combobox.Chips className="flex-1">
        {options.slice(0, 2).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
        <Combobox.Input
          className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
          placeholder={placeholder}
          aria-label="Frameworks"
        />
      </Combobox.Chips>
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
    {open && popup()}
  </Combobox.Root>
);

// The chips sit flush (gap-0), the consumer case the focus lift is for. Base UI hands the focus
// from the input to the chips (ArrowLeft at the start of the input) only when the input is inside
// Combobox.Chips
const chipsAroundInput = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)}>
    <Combobox.Control>
      <Combobox.Chips className="gap-0">
        {options.slice(0, 2).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
        <Combobox.Input
          className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
          aria-label="Frameworks"
        />
      </Combobox.Chips>
    </Combobox.Control>
  </Combobox.Root>
);

// One disabled multi-select with a chip, so that every part that shows a cursor is in it
const disabledChipsCombobox = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 1)} disabled>
    <Combobox.Control data-testid="control">
      <Combobox.Chips>
        {options.slice(0, 1).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
        <Combobox.Input aria-label="Frameworks" />
      </Combobox.Chips>
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
  </Combobox.Root>
);

describe("Combobox", () => {
  it("closed", async () => {
    const { fixture } = await renderFixture(<div style={{ width: 250 }}>{combobox()}</div>);
    await expect(fixture).toMatchScreenshot();
  });

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the input
  it("input focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 250 }}>{combobox()}</div>,
    );
    const input = getByRole("combobox");
    focusVisible(input);
    await expect(fixture).toMatchScreenshot();
  });

  // The same ring on the Control, 2px outside the wrapper around the chips and the input, and
  // none on the input: two rings showed before
  it("control focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 300 }}>{chipsCombobox()}</div>,
    );
    const input = getByRole("combobox");
    focusVisible(input);
    expect(getComputedStyle(input).outlineStyle).toBe("none");
    await expect(fixture).toMatchScreenshot();
  });

  // The arrow keys focus a chip, which draws the library ring; with flush chips the ring paints
  // over the next chip only while the focused chip is lifted (z-index 1)
  it("chip focus-visible, above the next chip", async () => {
    const { fixture, getByRole, getByText } = await renderFixture(
      <div style={{ width: 300 }}>{chipsAroundInput()}</div>,
    );
    focusVisible(getByRole("combobox"));
    // The first ArrowLeft focuses the last chip, the second the first of the two
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    const chip = getByText("React");
    expect(document.activeElement).toBe(chip);
    expect(chip.matches(":focus-visible")).toBe(true);
    const { outlineStyle, outlineWidth, outlineOffset, outlineColor } = getComputedStyle(chip);
    expect({ outlineStyle, outlineWidth, outlineOffset, outlineColor }).toEqual({
      outlineStyle: "solid",
      outlineWidth: "2px",
      outlineOffset: "2px",
      outlineColor: ringColor(),
    });
    expect(getComputedStyle(chip).zIndex).toBe("1");
    await expect(fixture).toMatchScreenshot();
  });

  it("ends the input's text box before the clear button, with a long placeholder", () => {
    const { getByRole } = render(
      <div style={{ width: 300 }}>
        {chipsCombobox({ placeholder: "Select one or more frameworks from the list" })}
      </div>,
    );
    const input = getByRole("combobox");
    const { paddingRight, borderRightWidth } = getComputedStyle(input);
    const textRight =
      input.getBoundingClientRect().right - parseFloat(paddingRight) - parseFloat(borderRightWidth);
    const clear = getByRole("button", { name: "Clear selection" }).getBoundingClientRect();
    expect(textRight).toBeLessThanOrEqual(clear.left);
  });

  // The chips sat flush against each other: Combobox.Chips had no gap (#478)
  it("leaves at least 4px between the chips", () => {
    const { getByText } = render(<div style={{ width: 300 }}>{chipsCombobox()}</div>);
    const react = getByText("React").getBoundingClientRect();
    const vue = getByText("Vue").getBoundingClientRect();
    expect(vue.left).toBeGreaterThanOrEqual(react.right + 4);
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>,
    );
    await expect(body).toMatchScreenshot();
  });

  // 8px keeps the popup clear of the input's ring; a consumer's sideOffset replaces it
  it.each([
    { offset: "by default", positionerProps: undefined, gap: 8 },
    { offset: "with sideOffset={0}", positionerProps: { sideOffset: 0 }, gap: 0 },
  ])("opens the popup $gap px below the input $offset", async ({ positionerProps, gap }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>{combobox({ defaultOpen: true, positionerProps })}</div>,
    );
    const popup = getByTestId("popup");
    // Floating UI positions the popup a moment after it mounts
    const box = await waitForStable(() => boxOf(popup));
    expect(box.top - getByRole("combobox").getBoundingClientRect().bottom).toBe(gap);
  });

  // Combobox.Empty stays mounted as a live region, so while items match it must take no space
  it("leaves no gap under the items, and shows the empty message when nothing matches", async () => {
    await renderPage(<div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>);
    await expect.element(page.getByRole("option", { name: "Svelte" })).toBeVisible();
    const empty = page.getByRole("status").element();
    expect(empty.textContent).toBe("");
    expect(empty.getBoundingClientRect().height).toBe(0);

    await page.getByRole("combobox").fill("zzz");
    await expect.element(page.getByText("No results found")).toBeVisible();
    expect(empty.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it("shows a not-allowed cursor on every part of a disabled Combobox", () => {
    const { getByRole, getByTestId } = render(disabledChipsCombobox());
    // A `<button>` has `cursor: default` from the user-agent stylesheet, so each needs its own
    expectNotAllowed(
      getByTestId("control"),
      getByRole("combobox"),
      getByRole("button", { name: "Show options" }),
      getByRole("button", { name: "Clear selection" }),
      getByRole("button", { name: "Remove React" }),
    );
  });

  // The Control no longer turns its pointer events off when disabled, so the pointer reaches
  // the buttons inside it: their hover colour must stay off
  it("keeps the clear and chip-remove buttons at their rest colour under the pointer when disabled", async () => {
    const { getByRole } = render(disabledChipsCombobox());
    for (const name of ["Clear selection", "Remove React"]) {
      const button = getByRole("button", { name });
      const rest = getComputedStyle(button).color;
      await userEvent.hover(button);
      expect(getComputedStyle(button).color, name).toBe(rest);
    }
  });
});

// The docs' single-select: Clear and Trigger sit over the input's end, in a `relative` wrapper.
// A long label ran under them: the input kept only its 12px of end padding (#520)
describe("Combobox.Input beside Clear and Trigger", () => {
  const long = { value: "long", label: "A framework whose label runs past the input's end" };
  const singleCombobox = (withClear: boolean) => (
    <div style={{ width: 250 }}>
      <Combobox.Root items={[long]} defaultValue={long}>
        <div className="relative">
          <Combobox.Input aria-label="Framework" />
          {withClear && <Combobox.Clear />}
          <Combobox.Trigger />
        </div>
      </Combobox.Root>
    </div>
  );

  it.each([
    { buttons: "Clear and Trigger", withClear: true, first: "Clear selection" },
    { buttons: "Trigger alone", withClear: false, first: "Show options" },
  ])("ends the input's text box before the first button, with $buttons", ({ withClear, first }) => {
    const { getByRole } = render(singleCombobox(withClear));
    const input = getByRole("combobox");
    const { paddingRight, borderRightWidth } = getComputedStyle(input);
    const textRight =
      input.getBoundingClientRect().right - parseFloat(paddingRight) - parseFloat(borderRightWidth);
    const button = getByRole("button", { name: first }).getBoundingClientRect();
    expect(textRight).toBeLessThanOrEqual(button.left);
  });
});

// A trigger-style Combobox: a button shows the selected value and the search input is in the popup.
// Base UI's Combobox.Value renders no element, so a value wider than the trigger had nothing to
// clip it. As Select.Value before #518, several words wrapped onto lines above and below the
// trigger, and one long word ran past it and pushed the chevron out (#541).
describe("Combobox.Value in a trigger", () => {
  // The Trigger's defaults are a chevron over an input's end (`absolute inset-y-0 end-0`): this
  // makes it a Select-like button
  const SELECT_LIKE =
    "static h-ui-height w-full justify-between rounded-md border border-input bg-background px-3 text-sm";

  it.each([
    { length: "short", fruit: "Fig", truncated: false },
    { length: "long", fruit: "Dragon fruit from the far end of the orchard", truncated: true },
    { length: "one-word long", fruit: "Supercalifragilisticexpialidocious", truncated: true },
  ])("keeps a $length value and the chevron inside a 140px trigger", ({ fruit, truncated }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Combobox.Root defaultValue={fruit}>
          <Combobox.Trigger aria-label="Fruit" className={SELECT_LIKE} style={{ width: 140 }}>
            <Combobox.Value data-testid="value" />
            <Combobox.Icon data-testid="icon" />
          </Combobox.Trigger>
        </Combobox.Root>
      </div>,
    );
    const trigger = getByRole("combobox", { name: "Fruit" });
    const content = contentSpan(trigger, "ltr");
    const icon = inlineSpan(getByTestId("icon"), "ltr");
    // Nothing spills out of the trigger: neither a long word to the side, nor wrapped lines above
    // and below it
    expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth);
    expect(trigger.scrollHeight).toBeLessThanOrEqual(trigger.clientHeight);
    expect(icon.end).toBeCloseTo(content.end, 1);
    expect(icon.end - icon.start).toBe(16);
    const value = getByTestId("value");
    const { top, bottom } = insetsWithin(trigger, value);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(0);
    expect(inlineSpan(value, "ltr").start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, "ltr").end).toBeLessThanOrEqual(icon.start);
    // Cut at the value's box, with an ellipsis: the text is wider than what shows
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    expect(value.scrollWidth > value.clientWidth).toBe(truncated);
  });

  // The one-line value must not widen the trigger past its container: Combobox.Trigger has
  // `min-w-0 max-w-full`, as Select.Trigger does (#518). Beside a button in a flex row it shrinks,
  // and sized by its value (`w-auto`) it stops at the container's width
  it.each([
    { layout: "beside a button in a 200px flex row", width: 200, row: true, trigger: undefined },
    { layout: "sized by its value in a 140px box", width: 140, row: false, trigger: "w-auto" },
  ])("keeps a trigger $layout inside it, with the value cut", ({ width, row, trigger }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <div data-testid="box" className={row ? "flex gap-2" : undefined} style={{ width }}>
          <Combobox.Root defaultValue="Dragon fruit from the far end of the orchard">
            <Combobox.Trigger
              aria-label="Fruit"
              className={[SELECT_LIKE, trigger].filter(Boolean).join(" ")}
            >
              <Combobox.Value data-testid="value" />
              <Combobox.Icon />
            </Combobox.Trigger>
          </Combobox.Root>
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

describePopupCssPath("Combobox.Popup", (open) => combobox({ open }));

// ComboboxPositioner's default sideOffset, the gap a single-select popup keeps below its input
const DEFAULT_SIDE_OFFSET = 8;

// The multi-select popup anchors to the Control, not the input in its padding (#478), on both
// motion paths.
describe.each(MOTION_PATHS)("Combobox.Popup under Combobox.Control, $path", ({ withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(async () => {
    await emulateReducedMotion(true);
    await enterMotionPath(true);
  });

  it("anchors the popup to the Control: its left edge, its width, and the default gap below its border", async () => {
    const { getByTestId } = render(
      <div style={{ padding: 40 }}>{chipsCombobox({ open: true })}</div>,
    );
    const multiPopup = await waitForStable(() => boxOf(getByTestId("popup")));
    const control = boxOf(getByTestId("control"));
    const width = (box: ReturnType<typeof boxOf>) => box.right - box.left;
    expect(Math.abs(multiPopup.left - control.left), "left edge").toBeLessThanOrEqual(1);
    expect(Math.abs(width(multiPopup) - width(control)), "width").toBeLessThanOrEqual(1);
    expect(
      Math.abs(multiPopup.top - control.bottom - DEFAULT_SIDE_OFFSET),
      `gap below the Control's border, ${DEFAULT_SIDE_OFFSET}px`,
    ).toBeLessThanOrEqual(1);
  });
});
