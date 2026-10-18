import { render } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { cn } from "../../lib/cn";
import {
  boxOf,
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
  ringColor,
  SETTLE_TIMEOUT_MS,
  settled,
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

// Base UI sets `data-placeholder` on every Combobox.Trigger while nothing is selected, the one
// beside an input too. Only what a Combobox.Value shows is muted (#564): the `render` element of a
// Trigger beside an input keeps the colour around it, as in 0.1.4
describe("Combobox.Trigger beside an input, with nothing selected", () => {
  it("keeps its render element in the colour around it", () => {
    const { getByRole, getByTestId } = render(
      <div data-testid="around" style={{ padding: 40 }}>
        <Combobox.Root items={options}>
          <div className="relative">
            <Combobox.Input aria-label="Framework" />
            <Combobox.Trigger
              aria-label="Fruit"
              render={
                <button type="button" data-testid="custom">
                  Choose
                </button>
              }
            />
          </div>
        </Combobox.Root>
        <span data-testid="muted" className="text-muted-foreground">
          Muted
        </span>
      </div>,
    );
    expect(getByRole("button", { name: "Fruit" }).hasAttribute("data-placeholder")).toBe(true);
    const colourOf = (testId: string) => getComputedStyle(getByTestId(testId)).color;
    expect(colourOf("muted")).not.toBe(colourOf("around"));
    expect(colourOf("custom")).toBe(colourOf("around"));
  });
});

// Trigger-style: a button shows the value, the search input is in the popup. Base UI's Value has no
// element, so a wide value wrapped or ran past the trigger and pushed the chevron out (#541). Each
// case runs in both directions: the value's `text-start` follows the direction, and the value, the
// badge and the chevron keep their inline order.
describe.each(["ltr", "rtl"] as const)("Combobox.Value in a trigger, %s", (dir) => {
  beforeEach(() => {
    document.documentElement.dir = dir;
  });
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  // The Trigger's defaults are a chevron over an input's end (`absolute inset-y-0 end-0`): this
  // makes it a Select-like button
  const SELECT_LIKE =
    "static h-ui-height w-full justify-between rounded-md border border-input bg-background px-3 text-sm";

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
          <Combobox.Root key={`${width} ${fruit}`} defaultValue={fruit}>
            <Combobox.Trigger aria-label="Fruit" className={SELECT_LIKE} style={{ width }}>
              <Combobox.Value />
              {badge && <span className="ms-2">{badge}</span>}
              <Combobox.Icon />
            </Combobox.Trigger>
          </Combobox.Root>
        ))}
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

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
    const content = contentSpan(trigger, dir);
    const icon = inlineSpan(getByTestId("icon"), dir);
    expect(icon.end).toBeCloseTo(content.end, 1);
    expect(icon.end - icon.start).toBe(16);
    const value = getByTestId("value");
    const { top, bottom } = insetsWithin(trigger, value);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeGreaterThanOrEqual(0);
    expect(inlineSpan(value, dir).start).toBeCloseTo(content.start, 1);
    expect(inlineSpan(value, dir).end).toBeLessThanOrEqual(icon.start);
    // Cut at the value's box, with an ellipsis: the text is wider than what shows
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    expect(value.scrollWidth > value.clientWidth).toBe(truncated);
  });

  // A badge beside the value keeps its width on one line, and the value takes only the free space
  // and truncates first, as on Select.Value (#546). Before, the value's flex-basis was its full
  // text width, so a long value and the badge shrank in proportion and the badge's two words
  // wrapped.
  it.each([
    { length: "short", fruit: "Fig", truncated: false },
    { length: "long", fruit: "Dragon fruit from the far end of the orchard", truncated: true },
  ])("keeps a badge beside a $length value on one line, at full width", ({ fruit, truncated }) => {
    const { getByRole, getByTestId } = render(
      <div style={{ padding: 40 }}>
        <Combobox.Root defaultValue={fruit}>
          <Combobox.Trigger aria-label="Fruit" className={SELECT_LIKE} style={{ width: 200 }}>
            <Combobox.Value data-testid="value" />
            <span data-testid="badge" className="ms-2">
              Pro plan
            </span>
            <Combobox.Icon data-testid="icon" />
          </Combobox.Trigger>
        </Combobox.Root>
        {/* The badge's one line at its own width, in the trigger's font */}
        <div data-testid="reference" className="w-max text-sm">
          Pro plan
        </div>
      </div>,
    );
    const content = contentSpan(getByRole("combobox", { name: "Fruit" }), dir);
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
            <Combobox.Trigger aria-label="Fruit" className={cn(SELECT_LIKE, trigger)}>
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
    // An overflow would pass the box's inline end: its right edge in LTR, its left edge in RTL
    const box = inlineSpan(getByTestId("box"), dir);
    expect(inlineSpan(getByRole("combobox"), dir).end).toBeLessThanOrEqual(box.end);
    if (row) expect(inlineSpan(getByRole("button"), dir).end).toBeLessThanOrEqual(box.end);
    const value = getByTestId("value");
    expect(getComputedStyle(value).textOverflow).toBe("ellipsis");
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
  });
});

// The placeholder is muted while nothing is selected, as on Select.Trigger, in a multi-select too
// (Base UI sets data-placeholder for an empty array as well), and a value has the colour of the
// text around the trigger. Base UI types `defaultValue` by `multiple`: the rows mix both, so the
// Root's type arguments are spelled out.
describe("Combobox.Value colour in a trigger", () => {
  it.each([
    { shows: "the placeholder muted", defaultValue: null, colour: "muted" },
    {
      shows: "the placeholder muted, in a multi-select",
      multiple: true,
      defaultValue: [],
      colour: "muted",
    },
    { shows: "a value in the colour around it", defaultValue: "Fig", colour: "around" },
  ])("shows $shows", ({ multiple, defaultValue, colour }) => {
    const { getByTestId } = render(
      <div data-testid="around">
        <Combobox.Root<string | string[], boolean> multiple={multiple} defaultValue={defaultValue}>
          <Combobox.Trigger aria-label="Fruit">
            <Combobox.Value data-testid="value" placeholder="Pick a fruit" />
            <Combobox.Icon />
          </Combobox.Trigger>
        </Combobox.Root>
        <span data-testid="muted" className="text-muted-foreground">
          Muted
        </span>
      </div>,
    );
    const colourOf = (testId: string) => getComputedStyle(getByTestId(testId)).color;
    expect(colourOf("muted")).not.toBe(colourOf("around"));
    expect(colourOf("value")).toBe(colourOf(colour));
  });
});

describePopupCssPath("Combobox.Popup", (open) => combobox({ open }));

// Base UI's Combobox Root, like Select's, passes `open` to the popup a commit late. The popup
// vanished at once when closed after Motion had gone idle (#540).
describe("Combobox.Popup closing, Motion", () => {
  beforeAll(() => enterMotionPath(true));
  beforeEach(() => emulateReducedMotion(false));
  afterAll(() => emulateReducedMotion(true));

  const below = (open: boolean) => <div style={{ padding: 40 }}>{combobox({ open })}</div>;

  it("fades and scales out, closed at rest", async () => {
    const { rerender, getByTestId } = render(below(true));
    const popup = getByTestId("popup");
    await expect
      .poll(() => getComputedStyle(popup).opacity, { timeout: SETTLE_TIMEOUT_MS })
      .toBe("1");
    await settled(popup);
    rerender(below(false));
    const frames = await framesOf(popup);
    // Still mounted on a frame that shows it part-way out
    expect(frames.some(({ scale, opacity }) => scale < 1 && opacity > 0 && opacity < 1)).toBe(true);
  });
});

// Trigger-style, with the search input in the popup. Base UI returns focus to the trigger only
// once the popup unmounts, after its exit: a Tab pressed while it closed went from the input in
// the closing popup to <body> (#627). On each path the popup leaves: the Motion spring (about
// 0.5s), the CSS transition (0.3s), and with reduced motion none (a frame).
describe.each([
  { path: "Motion", withMotion: true, reduce: false },
  { path: "CSS fallback", withMotion: false, reduce: false },
  { path: "reduced motion", withMotion: true, reduce: true },
])("Combobox with the input in the popup, closing, $path", ({ withMotion, reduce }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(() => emulateReducedMotion(reduce));
  afterAll(async () => {
    await emulateReducedMotion(true);
    await enterMotionPath(true);
  });

  const openInPopup = async () => {
    const view = render(
      <div className="flex w-60 flex-col items-start gap-2" style={{ padding: 40 }}>
        <button type="button">Before</button>
        <Combobox.Root items={options}>
          <Combobox.Trigger
            aria-label="Framework"
            className="static h-ui-height w-full rounded-md border border-input px-3"
          >
            <Combobox.Value placeholder="Pick a framework" />
            <Combobox.Icon />
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup aria-label="Frameworks" data-testid="popup">
                <Combobox.Input aria-label="Search frameworks" className="pe-3" />
                <Combobox.List>
                  {(item: (typeof options)[number]) => (
                    <Combobox.Item key={item.value} value={item}>
                      {item.label}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <button type="button">After</button>
      </div>,
    );
    const trigger = view.getByRole("combobox", { name: "Framework" });
    await userEvent.click(trigger);
    const input = await view.findByRole("combobox", { name: "Search frameworks" });
    await expect.poll(() => document.activeElement, { timeout: SETTLE_TIMEOUT_MS }).toBe(input);
    // Open at rest: closed during its entry, the CSS path's popup can leave at once
    const popup = view.getByTestId("popup");
    await settled(popup);
    return {
      trigger,
      popup,
      before: view.getByRole("button", { name: "Before" }),
      after: view.getByRole("button", { name: "After" }),
    };
  };

  // Whether the popup was still on the page when Tab went down. A Tab after the exit finds focus
  // back on the trigger, so the spec would pass without the fix.
  const recordTab = (popup: HTMLElement) => {
    let mounted: boolean | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") mounted = popup.isConnected;
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      return mounted;
    };
  };

  const unmounted = (popup: HTMLElement) =>
    expect.poll(() => popup.isConnected, { timeout: SETTLE_TIMEOUT_MS }).toBe(false);

  // Enter and Tab go in one call: with reduced motion the popup leaves a frame after the pick
  it("moves a Tab pressed during the exit past the trigger, after a pick by Enter", async () => {
    const { popup, after } = await openInPopup();
    await userEvent.keyboard("{ArrowDown}");
    const mountedOnTab = recordTab(popup);
    await userEvent.keyboard("{Enter}{Tab}");
    expect(mountedOnTab(), "the popup was still closing when Tab went down").toBe(true);
    await unmounted(popup);
    expect(document.activeElement).toBe(after);
  });

  // A click and a key press are two calls, too far apart for the one frame of reduced motion
  it.skipIf(reduce)(
    "moves a Tab pressed during the exit past the trigger, after a pick by click",
    async () => {
      const { popup, after } = await openInPopup();
      const mountedOnTab = recordTab(popup);
      await userEvent.click(page.getByRole("option", { name: "Vue" }));
      await userEvent.keyboard("{Tab}");
      expect(mountedOnTab(), "the popup was still closing when Tab went down").toBe(true);
      await unmounted(popup);
      expect(document.activeElement).toBe(after);
    },
  );

  // Enter with nothing highlighted closes the popup without preventDefault. Its keypress, on a
  // trigger that already had focus, clicked it and opened the popup again.
  it("keeps the popup closed and moves a Tab past the trigger, after Enter with nothing highlighted", async () => {
    const { popup, trigger, after } = await openInPopup();
    const mountedOnTab = recordTab(popup);
    await userEvent.keyboard("{Enter}{Tab}");
    expect(mountedOnTab(), "the popup was still closing when Tab went down").toBe(true);
    await unmounted(popup);
    expect(document.activeElement).toBe(after);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus to the trigger on Escape", async () => {
    const { popup, trigger } = await openInPopup();
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await unmounted(popup);
    expect(document.activeElement).toBe(trigger);
  });

  // The click focuses the button outside: the popup must not pull focus back to the trigger, nor
  // pass it through the trigger on the way, which would fire its focus and blur handlers
  it("leaves focus where an outside click put it", async () => {
    const { popup, trigger, before } = await openInPopup();
    let triggerFocused = false;
    trigger.addEventListener("focus", () => {
      triggerFocused = true;
    });
    await userEvent.click(before);
    expect(triggerFocused, "the trigger took focus on the way").toBe(false);
    expect(document.activeElement).toBe(before);
    await unmounted(popup);
    expect(document.activeElement).toBe(before);
  });
});

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
