import { render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Combobox } from "../components/combobox";
import { DatePicker } from "../components/date-picker";
import { Select } from "../components/select";
import { boxOf, overflowPast, waitForStable } from "../VisualTest.utils";

// A dropdown takes the width of the input that opens it, wider or narrower than its content
// (#506). The longest item makes the content about 300px wide; the long word breaks only where
// the popup is too narrow for it.
const LONG_WORD = "Supercalifragilisticexpialidocious";
const LABELS = ["Apple", "Cherry tomatoes from the garden", LONG_WORD];

const WIDTHS = [
  { input: "wider than its content", width: 360 },
  { input: "narrower than its content", width: 140 },
];

const NO_OVERFLOW = { top: 0, right: 0, bottom: 0, left: 0 };

const widthOf = (el: Element) => el.getBoundingClientRect().width;
// --anchor-width carries the anchor's width rounded to whole pixels
const expectWidthOf = (popup: Element, anchor: Element) =>
  expect(Math.abs(widthOf(popup) - widthOf(anchor))).toBeLessThanOrEqual(1);

/**
 * Renders `ui` in a column `width` px wide, 40px clear of the page's sides. 200px clear of its
 * top: a Select aligned over its trigger puts its selected item, the last, over the trigger, and
 * the items above it need the room: without it Select scrolls them out of the popup, or opens
 * below the trigger.
 */
const inColumn = (width: number, ui: ReactNode) =>
  render(
    <div style={{ padding: "200px 40px" }}>
      <div style={{ width }}>{ui}</div>
    </div>,
  );

/** Waits until Floating UI (or Select's own alignment) has placed the popup */
const settled = async (popup: HTMLElement) => {
  await waitForStable(() => boxOf(popup));
  return popup;
};

describe.each([
  { mode: "aligned over its trigger", alignItemWithTrigger: undefined, side: "none" },
  { mode: "below its trigger", alignItemWithTrigger: false, side: "bottom" },
])("Select.Popup $mode", ({ alignItemWithTrigger, side }) => {
  it.each(WIDTHS)("takes the trigger's width, $input ($width px)", async ({ width }) => {
    const { getByRole, getByTestId } = inColumn(
      width,
      <Select.Root defaultValue={LONG_WORD} defaultOpen>
        <Select.Trigger aria-label="Item">
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner alignItemWithTrigger={alignItemWithTrigger}>
            <Select.Popup data-testid="popup">
              {LABELS.map((label) => (
                <Select.Item key={label} value={label}>
                  <Select.ItemText>{label}</Select.ItemText>
                  <Select.ItemIndicator data-testid="indicator" />
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    const popup = await settled(getByTestId("popup"));
    expect(popup.getAttribute("data-side"), "the positioning mode under test").toBe(side);
    expectWidthOf(popup, getByRole("combobox"));
    expect(overflowPast(popup), "item text past the popup's edges").toEqual(NO_OVERFLOW);

    // The selected item's check mark keeps its room at the item's end, clear of the wrapped text
    const option = getByRole("option", { name: LONG_WORD });
    const text = within(option).getByText(LONG_WORD).getBoundingClientRect();
    const indicator = getByTestId("indicator").getBoundingClientRect();
    expect(text.right, "text end, before the check mark").toBeLessThanOrEqual(indicator.left);
    expect(indicator.right, "check mark end, inside the item").toBeLessThanOrEqual(
      option.getBoundingClientRect().right,
    );
  });
});

describe("Select.Item with a badge beside its text", () => {
  it("keeps the badge on one line while the text wraps (200 px trigger)", async () => {
    const { getByTestId } = inColumn(
      200,
      <Select.Root defaultValue="tomatoes" defaultOpen>
        <Select.Trigger aria-label="Item">
          <Select.Value />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner alignItemWithTrigger={false}>
            <Select.Popup data-testid="popup">
              <Select.Item value="tomatoes">
                <Select.ItemText>Cherry tomatoes from the garden patch</Select.ItemText>
                <span data-testid="badge">New</span>
                <Select.ItemIndicator />
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    await settled(getByTestId("popup"));
    const badge = getByTestId("badge");
    const lineHeight = Number.parseFloat(getComputedStyle(badge).lineHeight);
    expect(badge.getBoundingClientRect().height, "badge height: one line").toBeLessThanOrEqual(
      lineHeight + 1,
    );
  });
});

describe("Select.Positioner opt-outs", () => {
  const items = ["Strawberry", "Apple"];
  const select = (positionerClass: string, triggerClass?: string) => (
    <Select.Root defaultValue="Strawberry" defaultOpen>
      <Select.Trigger aria-label="Item" className={triggerClass}>
        <Select.Value />
        <Select.Icon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className={positionerClass} alignItemWithTrigger={false}>
          <Select.Popup data-testid="popup">
            {items.map((label) => (
              <Select.Item key={label} value={label}>
                <Select.ItemText>{label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );

  it("w-auto sizes the popup by its items, narrower than a 360 px trigger", async () => {
    const { getByRole, getByTestId } = inColumn(360, select("w-auto"));
    const popup = await settled(getByTestId("popup"));
    expect(widthOf(popup)).toBeLessThan(widthOf(getByRole("combobox")));
  });

  it("w-auto min-w-[var(--anchor-width)] suits a trigger sized by its value", async () => {
    const { getAllByRole, getByRole, getByTestId } = inColumn(
      360,
      select("w-auto min-w-[var(--anchor-width)]", "w-auto"),
    );
    const popup = await settled(getByTestId("popup"));
    expect(widthOf(getByRole("combobox")), "the trigger fits its value").toBeLessThan(200);
    // --anchor-width carries the trigger's width rounded to whole pixels
    expect(widthOf(popup)).toBeGreaterThanOrEqual(widthOf(getByRole("combobox")) - 1);
    // A one-line item is its line plus its padding, with 1px for rounding
    for (const option of getAllByRole("option")) {
      const { lineHeight, paddingTop, paddingBottom } = getComputedStyle(option);
      const oneLine = [lineHeight, paddingTop, paddingBottom].map(Number.parseFloat);
      expect(option.getBoundingClientRect().height, "an item on one line").toBeLessThanOrEqual(
        oneLine.reduce((sum, px) => sum + px) + 1,
      );
    }
  });
});

const comboboxPopup = (
  <Combobox.Portal>
    <Combobox.Positioner>
      <Combobox.Popup data-testid="popup">
        <Combobox.List>
          {(label: string) => (
            <Combobox.Item key={label} value={label}>
              <Combobox.ItemIndicator />
              {label}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
);

describe("Combobox.Popup", () => {
  it.each(WIDTHS)("takes the input's width, $input ($width px)", async ({ width }) => {
    const { getByRole, getByTestId } = inColumn(
      width,
      <Combobox.Root items={LABELS} defaultOpen>
        <Combobox.Input aria-label="Item" />
        {comboboxPopup}
      </Combobox.Root>,
    );
    const popup = await settled(getByTestId("popup"));
    expectWidthOf(popup, getByRole("combobox"));
    expect(overflowPast(popup), "item text past the popup's edges").toEqual(NO_OVERFLOW);
  });

  // A multi-select popup anchors to the Control around the chips and the input (#478)
  it.each(WIDTHS)(
    "takes the Control's width in a multi-select, $input ($width px)",
    async ({ width }) => {
      const { getByTestId } = inColumn(
        width,
        <Combobox.Root multiple items={LABELS} defaultValue={LABELS.slice(0, 1)} defaultOpen>
          <Combobox.Control data-testid="control">
            <Combobox.Chips className="flex-1">
              <Combobox.Chip>
                {LABELS[0]}
                <Combobox.ChipRemove />
              </Combobox.Chip>
              <Combobox.Input
                className="h-7 min-w-20 flex-1 border-0 bg-transparent px-0"
                aria-label="Items"
              />
            </Combobox.Chips>
            <Combobox.Clear />
            <Combobox.Trigger />
          </Combobox.Control>
          {comboboxPopup}
        </Combobox.Root>,
      );
      const popup = await settled(getByTestId("popup"));
      expectWidthOf(popup, getByTestId("control"));
      expect(overflowPast(popup), "item text past the popup's edges").toEqual(NO_OVERFLOW);
    },
  );
});

describe("DatePicker popup", () => {
  /** Opens the picker in a column `width` px wide; resolves to its trigger and its popup */
  const open = async (width: number) => {
    inColumn(width, <DatePicker />);
    const trigger = page.getByRole("button", { name: "Pick a date" });
    await trigger.click();
    await expect.element(page.getByRole("dialog")).toBeInTheDocument();
    const popup = await settled(page.getByRole("dialog").element() as HTMLElement);
    return { trigger: trigger.element(), popup };
  };

  // The calendar is about 280px wide, and centred in a wider popup
  it("takes the trigger's width when the trigger is wider than the calendar", async () => {
    const { trigger, popup } = await open(360);
    expectWidthOf(popup, trigger);
    const calendar = (popup.firstElementChild as HTMLElement).getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    expect(
      Math.abs(calendar.left - box.left - (box.right - calendar.right)),
      "the calendar's room on either side",
    ).toBeLessThanOrEqual(1);
  });

  it("keeps the calendar's width when the trigger is narrower", async () => {
    const { trigger, popup } = await open(140);
    expect(widthOf(popup)).toBeGreaterThan(widthOf(trigger));
    expect(overflowPast(popup), "the calendar past the popup's edges").toEqual(NO_OVERFLOW);
  });
});
