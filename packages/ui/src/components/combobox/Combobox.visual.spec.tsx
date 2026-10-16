import { render } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import {
  boxOf,
  describePopupCssPath,
  enterMotionPath,
  expectNotAllowed,
  focusVisible,
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
const chipsCombobox = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)}>
    <Combobox.Control>
      <Combobox.Chips>
        {options.slice(0, 2).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
      </Combobox.Chips>
      <Combobox.Input
        className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
        placeholder="Select framework..."
        aria-label="Frameworks"
      />
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
  </Combobox.Root>
);

// The docs' multi-select with its popup open from the start, to measure the popup against the
// Control
const openChipsCombobox = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)} defaultOpen>
    <Combobox.Control data-testid="control">
      <Combobox.Chips>
        {options.slice(0, 2).map((item) => (
          <Combobox.Chip key={item.value}>
            {item.label}
            <Combobox.ChipRemove />
          </Combobox.Chip>
        ))}
      </Combobox.Chips>
      <Combobox.Input
        className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
        placeholder="Select framework..."
        aria-label="Frameworks"
      />
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
    {popup()}
  </Combobox.Root>
);

// Base UI hands the focus from the input to the chips (ArrowLeft at the start of the input) only
// when the input is inside Combobox.Chips
const chipsAroundInput = () => (
  <Combobox.Root multiple items={options} defaultValue={options.slice(0, 2)}>
    <Combobox.Control>
      <Combobox.Chips>
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
      </Combobox.Chips>
      <Combobox.Input aria-label="Frameworks" />
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

  // The arrow keys focus a chip, which draws the library ring; the screenshot shows the whole
  // ring beside the next chip
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
    await expect(fixture).toMatchScreenshot();
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

describePopupCssPath("Combobox.Popup", (open) => combobox({ open }));

// The docs' multi-select popup sat at the input's left edge, at the input's width, and closer
// to the Control's border than the single-select popup sits to its input: the Control was a
// plain <div>, so the popup anchored to the input inside the Control's padding (#478). The
// Control is now Base UI's Combobox.InputGroup, the part the popup anchors to. Both paths, as
// the spring and the CSS transition each scale the popup before it comes to rest.
describe.each(MOTION_PATHS)("Combobox.Popup under Combobox.Control, $path", ({ withMotion }) => {
  beforeAll(() => enterMotionPath(withMotion));
  beforeEach(async () => {
    await commands.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
  });
  afterAll(async () => {
    await commands.emulateMedia({ reducedMotion: "reduce" });
    await enterMotionPath(true);
  });

  it("anchors the popup to the Control: its left edge, its width, and the single-select gap below its border", async () => {
    const single = render(<div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>);
    const singlePopup = await waitForStable(() => boxOf(single.getByTestId("popup")));
    const singleGap = singlePopup.top - single.getByRole("combobox").getBoundingClientRect().bottom;
    single.unmount();

    const { getByTestId } = render(<div style={{ padding: 40 }}>{openChipsCombobox()}</div>);
    const multiPopup = await waitForStable(() => boxOf(getByTestId("popup")));
    const control = boxOf(getByTestId("control"));
    const width = (box: ReturnType<typeof boxOf>) => box.right - box.left;
    expect(Math.abs(multiPopup.left - control.left), "left edge").toBeLessThanOrEqual(1);
    expect(Math.abs(width(multiPopup) - width(control)), "width").toBeLessThanOrEqual(1);
    expect(
      Math.abs(multiPopup.top - control.bottom - singleGap),
      `gap below the Control's border, single-select gap ${singleGap}px`,
    ).toBeLessThanOrEqual(1);
  });
});
