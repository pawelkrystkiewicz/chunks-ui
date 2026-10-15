import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import {
  boxOf,
  expectNotAllowed,
  focusVisible,
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

// Combobox.Empty reads the filtered `items` on Root: without them it counts no matches and
// shows its message under the items
const combobox = ({
  defaultOpen = false,
  positionerProps,
}: {
  defaultOpen?: boolean;
  positionerProps?: ComboboxPositionerProps;
} = {}) => (
  <Combobox.Root items={options} defaultOpen={defaultOpen}>
    <Combobox.Input placeholder="Search framework..." />
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
  </Combobox.Root>
);

// The docs' multi-select: the Control draws the ring (`has-[:focus-visible]`) while the input
// inside it has focus, and the input's own ring is off
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
        className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0 focus-visible:outline-none"
        placeholder="Select framework..."
        aria-label="Frameworks"
      />
      <Combobox.Clear />
      <Combobox.Trigger />
    </Combobox.Control>
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
        <Combobox.Input aria-label="Frameworks" />
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

  // The same ring on the Control, 2px outside the wrapper around the chips and the input
  it("control focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 300 }}>{chipsCombobox()}</div>,
    );
    const input = getByRole("combobox");
    focusVisible(input);
    expect(getComputedStyle(input).outlineStyle).toBe("none");
    await expect(fixture).toMatchScreenshot();
  });

  // The arrow keys move the focus from the input to the chips: a chip draws the library ring,
  // not the browser's outline
  it("draws the ring on a chip the arrow keys focus", async () => {
    const { getByRole, getByText } = render(chipsAroundInput());
    focusVisible(getByRole("combobox"));
    await userEvent.keyboard("{ArrowLeft}");
    const chip = getByText("Vue");
    expect(document.activeElement).toBe(chip);
    expect(chip.matches(":focus-visible")).toBe(true);
    const { outlineStyle, outlineWidth, outlineOffset, outlineColor } = getComputedStyle(chip);
    expect({ outlineStyle, outlineWidth, outlineOffset, outlineColor }).toEqual({
      outlineStyle: "solid",
      outlineWidth: "2px",
      outlineOffset: "2px",
      outlineColor: ringColor(),
    });
  });

  it("open", async () => {
    const body = await renderPage(
      <div style={{ padding: 40 }}>{combobox({ defaultOpen: true })}</div>,
    );
    await expect(body).toMatchScreenshot();
  });

  // The ring is 2px of --ring 2px outside the input: 8px keeps the popup clear of it, as on
  // Popover.Content and Menu.Content. A consumer's sideOffset replaces the default.
  it.each([
    { offset: "by default", positionerProps: undefined, gap: 8 },
    { offset: "with sideOffset={2}", positionerProps: { sideOffset: 2 }, gap: 2 },
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
