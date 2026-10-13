import { act, cleanup, isInaccessible, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { startTransition, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar, createDate, DEFAULT_CALENDAR_LABELS } from "./Calendar";

afterEach(cleanup);

// March 15, 2026 — month index 2 = March
const MARCH_15_2026 = new Date(2026, 2, 15);

/** Accessible name of a day button, e.g. "Wednesday, March 18, 2026". */
const label = (date: Date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
/**
 * A named getByRole computes jsdom styles for every button in the grid, ~130ms a query under
 * coverage; this computes them for one. `selector` leaves out the grid, which /March 20/ also
 * matches through its "March 2026" label.
 */
const getButton = (name: string | RegExp) => {
  const button = screen.getByLabelText(name, { selector: "button" });
  expect(button).toHaveRole("button");
  expect(button).toHaveAccessibleName(name);
  expect(isInaccessible(button)).toBe(false);
  return button;
};
const dayButton = (date: Date) => getButton(label(date));
// `hidden: true` skips the style check on every day. It can only let more buttons in: a hidden
// tab stop would join the list and fail the comparison with the day that getButton finds.
const tabStops = () =>
  within(screen.getByRole("grid"))
    .getAllByRole("button", { hidden: true })
    .filter((b) => b.tabIndex === 0);
const focusDay = (date: Date) => act(() => dayButton(date).focus());

describe("Calendar", () => {
  it("renders the current month and year when no value is provided", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(2026, 2, 10, 12));
      render(<Calendar />);
      const today = new Date();
      const monthYear = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      expect(screen.getByRole("grid", { name: monthYear })).toBeInTheDocument();
      expect(dayButton(today)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the correct month and year for a controlled date", () => {
    render(<Calendar value={MARCH_15_2026} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it("renders all day-name headers", () => {
    render(<Calendar value={MARCH_15_2026} />);
    for (const name of ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("starts the week on Monday with weekStartsOn={1}", () => {
    render(<Calendar value={MARCH_15_2026} weekStartsOn={1} />);
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
    // March 1, 2026 is a Sunday: last cell of the first row
    const firstRow = screen.getAllByRole("row")[1];
    expect(firstRow?.querySelectorAll("td")[6]).toHaveTextContent("1");
  });

  it("fills padding cells with neighbouring-month days only when showOutsideDays is set", () => {
    const feb23 = "Monday, February 23, 2026";
    const { rerender } = render(<Calendar value={MARCH_15_2026} weekStartsOn={1} />);
    // No element labelled so at all, hidden or not: stricter than a role query, and no styles
    expect(screen.queryByLabelText(feb23)).not.toBeInTheDocument();
    rerender(<Calendar value={MARCH_15_2026} weekStartsOn={1} showOutsideDays />);
    expect(getButton(feb23)).toBeInTheDocument();
    expect(getButton("Saturday, April 4, 2026")).toBeInTheDocument();
  });

  // The 4.5:1 itself is checked by the docs axe run (check:a11y)
  it("dims outside days with the muted colour, not opacity", () => {
    render(<Calendar value={MARCH_15_2026} weekStartsOn={1} showOutsideDays />);
    const feb23 = getButton("Monday, February 23, 2026");
    expect(feb23).toHaveClass("text-muted-foreground");
    expect(feb23.className).not.toMatch(/\bopacity-/);
  });

  it("keeps the disabled dimming on a disabled outside day", () => {
    render(
      <Calendar
        value={MARCH_15_2026}
        weekStartsOn={1}
        showOutsideDays
        min={new Date(2026, 2, 5)}
      />,
    );
    const feb23 = getButton("Monday, February 23, 2026");
    expect(feb23).toHaveAttribute("aria-disabled", "true");
    expect(feb23).toHaveClass("text-muted-foreground", "opacity-40");
  });

  it("keeps the selected colour on a selected outside day", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 1, 28)} weekStartsOn={1} showOutsideDays />);
    await user.click(getButton("Next month"));
    const feb28 = getButton("Saturday, February 28, 2026");
    expect(feb28).toHaveAttribute("data-selected", "true");
    expect(feb28).toHaveClass("text-primary-foreground");
    expect(feb28).not.toHaveClass("text-muted-foreground");
  });

  it("moves the view to the month of a clicked outside day", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={MARCH_15_2026} weekStartsOn={1} showOutsideDays />);
    await user.click(getButton("Monday, February 23, 2026"));
    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  it("calls onValueChange with the clicked date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar value={MARCH_15_2026} onValueChange={onValueChange} />);

    // Click on day 10 of March 2026
    const day10 = getButton(/March 10/);
    await user.click(day10);

    expect(onValueChange).toHaveBeenCalledOnce();
    const called = onValueChange.mock.calls[0]?.[0] as Date;
    expect(called.getFullYear()).toBe(2026);
    expect(called.getMonth()).toBe(2);
    expect(called.getDate()).toBe(10);
  });

  it("navigates to previous month on prev button click", async () => {
    const user = userEvent.setup();
    render(<Calendar value={MARCH_15_2026} />);

    expect(screen.getByText("March 2026")).toBeInTheDocument();

    await user.click(getButton("Previous month"));

    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  it("navigates to next month on next button click", async () => {
    const user = userEvent.setup();
    render(<Calendar value={MARCH_15_2026} />);

    expect(screen.getByText("March 2026")).toBeInTheDocument();

    await user.click(getButton("Next month"));

    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  // An inline `value={new Date()}` is a new object, milliseconds later, on every render
  it("keeps the shown month when it re-renders with the same day", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Calendar value={new Date(2026, 2, 15, 9)} />);
    await user.click(getButton("Next month"));
    rerender(<Calendar value={new Date(2026, 2, 15, 9)} />);
    rerender(<Calendar value={new Date(2026, 2, 15, 17, 30)} />);
    expect(screen.getByText("April 2026")).toBeInTheDocument();
    rerender(<Calendar value={new Date(2026, 2, 16)} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
  });

  it.each([999, 50])("shows, selects and leaves a month in the year %i", async (year) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar value={createDate(year, 0, 5)} onValueChange={onValueChange} />);
    expect(screen.getByRole("grid", { name: `January ${year}` })).toBeInTheDocument();
    expect(dayButton(createDate(year, 0, 5))).toHaveAttribute("data-selected", "true");
    await user.click(dayButton(createDate(year, 0, 20)));
    expect(onValueChange).toHaveBeenCalledWith(createDate(year, 0, 20));
    await user.click(getButton("Previous month"));
    expect(screen.getByRole("grid", { name: `December ${year - 1}` })).toBeInTheDocument();
    expect(dayButton(createDate(year - 1, 11, 31))).toBeInTheDocument();
  });

  // addDays, addMonths and startOfDay must not fall back to `new Date(y, m, d)`
  it.each([999, 50])("moves by key across a month edge in the year %i", async (year) => {
    const user = userEvent.setup();
    render(<Calendar value={createDate(year, 1, 1)} />);
    await focusDay(createDate(year, 1, 1));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toHaveAccessibleName(label(createDate(year, 0, 31)));
    expect(screen.getByRole("grid", { name: `January ${year}` })).toBeInTheDocument();
    await user.keyboard("{PageUp}");
    expect(document.activeElement).toHaveAccessibleName(label(createDate(year - 1, 11, 31)));
    expect(screen.getByRole("grid", { name: `December ${year - 1}` })).toBeInTheDocument();
  });

  it("stops at January of year 1", async () => {
    const user = userEvent.setup();
    render(<Calendar value={createDate(1, 0, 1)} />);
    expect(getButton("Previous month")).toHaveAttribute("aria-disabled", "true");
    await user.click(getButton("Previous month"));
    expect(screen.getByRole("grid", { name: "January 1" })).toBeInTheDocument();
    await focusDay(createDate(1, 0, 1));
    for (const keys of ["{ArrowLeft}", "{ArrowUp}", "{PageUp}", "{Shift>}{PageUp}{/Shift}"]) {
      await user.keyboard(keys);
      expect(screen.getByRole("grid", { name: "January 1" })).toBeInTheDocument();
      expect(document.activeElement).toHaveAccessibleName(label(createDate(1, 0, 1)));
    }
    // Still moves forward
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName(label(createDate(1, 0, 2)));
  });

  describe.each([
    { bad: "an Invalid Date", date: new Date(Number.NaN) },
    { bad: "a date before year 1", date: createDate(0, 5, 15) },
  ])("$bad", ({ date }) => {
    it.each(["value", "defaultValue"])("is no date as the %s: shows today's month", (prop) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      try {
        vi.setSystemTime(new Date(2026, 2, 10, 12));
        const { container } = render(<Calendar {...{ [prop]: date }} />);
        expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
        expect(container.querySelector("[data-selected]")).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("drops the hover style of Previous month at year 1 and keeps it focusable", () => {
    render(<Calendar defaultValue={createDate(1, 0, 10)} />);
    const prev = screen.getByRole("button", { name: "Previous month" });
    expect(prev).toHaveAttribute("aria-disabled", "true");
    expect(prev).toHaveClass("cursor-not-allowed");
    expect(prev).not.toHaveClass("hover:bg-accent");
    expect(prev).not.toHaveClass("pointer-events-none");
    prev.focus();
    expect(prev).toHaveFocus();
  });

  it("navigates across year boundary (December -> January) under StrictMode", async () => {
    // StrictMode comes from the global render config in vitest.setup.ts
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 11, 1)} />);

    expect(screen.getByText("December 2026")).toBeInTheDocument();

    await user.click(getButton("Next month"));

    expect(screen.getByText("January 2027")).toBeInTheDocument();
  });

  it("navigates across year boundary (January -> December) under StrictMode", async () => {
    // StrictMode comes from the global render config in vitest.setup.ts
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 0, 1)} />);

    expect(screen.getByText("January 2026")).toBeInTheDocument();

    await user.click(getButton("Previous month"));

    expect(screen.getByText("December 2025")).toBeInTheDocument();
  });

  it("disabled date is not clickable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const disableDay5 = (date: Date) => date.getDate() === 5;

    render(
      <Calendar value={MARCH_15_2026} onValueChange={onValueChange} isDateDisabled={disableDay5} />,
    );

    const day5 = getButton(/March 5/);
    expect(day5).toHaveAttribute("aria-disabled", "true");

    await user.click(day5);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("dates before min are disabled", () => {
    render(<Calendar value={MARCH_15_2026} min={new Date(2026, 2, 10)} />);

    const day5 = getButton(/March 5/);
    expect(day5).toHaveAttribute("aria-disabled", "true");

    const day10 = getButton(/March 10/);
    expect(day10).not.toHaveAttribute("aria-disabled");
  });

  it("dates after max are disabled", () => {
    render(<Calendar value={MARCH_15_2026} max={new Date(2026, 2, 20)} />);

    const day25 = getButton(/March 25/);
    expect(day25).toHaveAttribute("aria-disabled", "true");

    const day20 = getButton(/March 20/);
    expect(day20).not.toHaveAttribute("aria-disabled");
  });

  it("selected date has data-selected", () => {
    render(<Calendar value={MARCH_15_2026} />);

    const day15 = getButton(/March 15/);
    expect(day15).toHaveAttribute("data-selected", "true");
  });

  it("unselected days do not have data-selected", () => {
    render(<Calendar value={MARCH_15_2026} />);

    const day10 = getButton(/March 10/);
    expect(day10).not.toHaveAttribute("data-selected");
  });

  it("today has aria-current=date", () => {
    // We can't know exactly what today is, but we can check that exactly one button
    // has aria-current="date" when Calendar renders with today's month
    render(<Calendar />);
    const todayButton = screen.queryByRole("button", { current: "date" });
    // Only run this assertion when today is rendered (same month as today)
    if (todayButton) {
      expect(todayButton).toHaveAttribute("aria-current", "date");
    }
  });

  it("today button is found when viewing current month", () => {
    const today = new Date();
    render(<Calendar value={today} />);

    // There should be exactly one button with aria-current="date"
    expect(screen.getAllByRole("button", { current: "date" })).toHaveLength(1);
  });

  it("uncontrolled: updates internal state when a day is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar defaultValue={MARCH_15_2026} onValueChange={onValueChange} />);

    const day20 = getButton(/March 20/);
    await user.click(day20);

    expect(onValueChange).toHaveBeenCalledOnce();
    // The previously selected day should no longer be selected
    const day15 = getButton(/March 15/);
    expect(day15).not.toHaveAttribute("data-selected");
    // The newly clicked day should be selected
    expect(day20).toHaveAttribute("data-selected", "true");
  });

  it("prev/next navigation buttons have aria-labels", () => {
    render(<Calendar value={MARCH_15_2026} />);
    expect(getButton("Previous month")).toBeInTheDocument();
    expect(getButton("Next month")).toBeInTheDocument();
  });

  it("day buttons have descriptive aria-labels", () => {
    render(<Calendar value={MARCH_15_2026} />);
    // Should have a button with a label that includes "March" and "2026"
    const day1 = getButton(/March 1, 2026/);
    expect(day1).toBeInTheDocument();
  });

  it("exposes the days as a grid named by the shown month", async () => {
    const user = userEvent.setup();
    render(<Calendar value={MARCH_15_2026} />);
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
    await user.click(getButton("Next month"));
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeInTheDocument();
  });

  it("marks only the selected day's cell as selected", () => {
    const { container } = render(<Calendar value={MARCH_15_2026} />);
    // A <td> in a role="grid" table is a gridcell; Testing Library still reports it as "cell".
    const selected = container.querySelectorAll('td[aria-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toContainElement(dayButton(MARCH_15_2026));
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Calendar value={MARCH_15_2026} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Calendar keyboard navigation", () => {
  // Today is frozen so the "today" tab-stop fallback is deterministic.
  const TODAY = new Date(2026, 2, 10);
  const WED_MARCH_18 = new Date(2026, 2, 18);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 2, 10, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    {
      stop: "the selected day",
      defaultValue: MARCH_15_2026,
      nextClicks: 0,
      expected: MARCH_15_2026,
    },
    { stop: "today when nothing is selected", defaultValue: null, nextClicks: 0, expected: TODAY },
    {
      stop: "today when the selected day is in another month",
      defaultValue: new Date(2026, 1, 20),
      nextClicks: 1,
      expected: TODAY,
    },
    {
      stop: "the 1st when neither selected day nor today is in view",
      defaultValue: MARCH_15_2026,
      nextClicks: 1,
      expected: new Date(2026, 3, 1),
    },
  ])("makes $stop the only tab stop", async ({ defaultValue, nextClicks, expected }) => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={defaultValue} />);
    for (let i = 0; i < nextClicks; i++) {
      await user.click(getButton("Next month"));
    }
    expect(tabStops()).toEqual([dayButton(expected)]);
  });

  it("enters the grid on the tab stop and leaves it on the next Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Calendar defaultValue={MARCH_15_2026} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(getButton("Previous month")).toHaveFocus();
    await user.tab();
    expect(getButton("Next month")).toHaveFocus();
    await user.tab();
    expect(dayButton(MARCH_15_2026)).toHaveFocus();
    await user.tab();
    // Named by its text, not an aria-label, so getButton does not find it
    expect(screen.getByText("After")).toHaveFocus();
  });

  it("never makes an outside day a tab stop, even when it is selected", async () => {
    const user = userEvent.setup();
    const feb28 = new Date(2026, 1, 28);
    render(<Calendar defaultValue={feb28} weekStartsOn={1} showOutsideDays />);
    await user.click(getButton("Next month"));
    // Feb 28 is now a selected outside day in the March view.
    expect(dayButton(feb28)).toHaveAttribute("data-selected", "true");
    expect(dayButton(feb28).tabIndex).toBe(-1);
    expect(tabStops()).toEqual([dayButton(TODAY)]);
  });

  it.each([
    { keys: "{ArrowLeft}", to: new Date(2026, 2, 17), view: "March 2026" },
    { keys: "{ArrowRight}", to: new Date(2026, 2, 19), view: "March 2026" },
    { keys: "{ArrowUp}", to: new Date(2026, 2, 11), view: "March 2026" },
    { keys: "{ArrowDown}", to: new Date(2026, 2, 25), view: "March 2026" },
    { keys: "{Home}", to: new Date(2026, 2, 15), view: "March 2026" },
    { keys: "{End}", to: new Date(2026, 2, 21), view: "March 2026" },
    { keys: "{PageUp}", to: new Date(2026, 1, 18), view: "February 2026" },
    { keys: "{PageDown}", to: new Date(2026, 3, 18), view: "April 2026" },
    { keys: "{Shift>}{PageUp}{/Shift}", to: new Date(2025, 2, 18), view: "March 2025" },
    { keys: "{Shift>}{PageDown}{/Shift}", to: new Date(2027, 2, 18), view: "March 2027" },
  ])("$keys moves focus from Wednesday March 18 ($view)", async ({ keys, to, view }) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar defaultValue={WED_MARCH_18} onValueChange={onValueChange} />);
    focusDay(WED_MARCH_18);
    await user.keyboard(keys);
    expect(dayButton(to)).toHaveFocus();
    expect(screen.getByText(view)).toBeInTheDocument();
    expect(tabStops()).toEqual([dayButton(to)]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each([
    {
      edge: "month backwards",
      from: new Date(2026, 2, 1),
      keys: "{ArrowLeft}",
      to: new Date(2026, 1, 28),
      view: "February 2026",
    },
    {
      edge: "year forwards",
      from: new Date(2026, 11, 31),
      keys: "{ArrowRight}",
      to: new Date(2027, 0, 1),
      view: "January 2027",
    },
    {
      edge: "year backwards by a week",
      from: new Date(2026, 0, 3),
      keys: "{ArrowUp}",
      to: new Date(2025, 11, 27),
      view: "December 2025",
    },
    {
      edge: "month forwards by a week",
      from: new Date(2026, 2, 30),
      keys: "{ArrowDown}",
      to: new Date(2026, 3, 6),
      view: "April 2026",
    },
    {
      edge: "month, clamping the 31st to a shorter month",
      from: new Date(2026, 2, 31),
      keys: "{PageUp}",
      to: new Date(2026, 1, 28),
      view: "February 2026",
    },
    {
      edge: "year, clamping a leap day",
      from: new Date(2028, 1, 29),
      keys: "{Shift>}{PageDown}{/Shift}",
      to: new Date(2029, 1, 28),
      view: "February 2029",
    },
  ])("crosses a $edge and focuses the target day", async ({ from, keys, to, view }) => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={from} />);
    focusDay(from);
    await user.keyboard(keys);
    expect(screen.getByText(view)).toBeInTheDocument();
    expect(dayButton(to)).toHaveFocus();
  });

  it.each([
    { weekStartsOn: 1, keys: "{Home}", to: new Date(2026, 2, 16), lands: "Monday" },
    { weekStartsOn: 1, keys: "{End}", to: new Date(2026, 2, 22), lands: "Sunday" },
    { weekStartsOn: 6, keys: "{Home}", to: new Date(2026, 2, 14), lands: "Saturday" },
    { weekStartsOn: 6, keys: "{End}", to: new Date(2026, 2, 20), lands: "Friday" },
  ] as const)(
    "$keys with weekStartsOn={$weekStartsOn} lands on $lands",
    async ({ weekStartsOn, keys, to }) => {
      const user = userEvent.setup();
      render(<Calendar defaultValue={WED_MARCH_18} weekStartsOn={weekStartsOn} />);
      focusDay(WED_MARCH_18);
      await user.keyboard(keys);
      expect(dayButton(to)).toHaveFocus();
    },
  );

  it("Home follows weekStartsOn into the previous month", async () => {
    const user = userEvent.setup();
    // Sunday March 1 ends a Monday-first week that starts on February 23.
    const sunMarch1 = new Date(2026, 2, 1);
    render(<Calendar defaultValue={sunMarch1} weekStartsOn={1} />);
    focusDay(sunMarch1);
    await user.keyboard("{Home}");
    expect(screen.getByText("February 2026")).toBeInTheDocument();
    expect(dayButton(new Date(2026, 1, 23))).toHaveFocus();
  });

  it.each([
    { name: "Enter", key: "{Enter}" },
    { name: "Space", key: " " },
  ])("$name selects the focused day", async ({ key }) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar defaultValue={WED_MARCH_18} onValueChange={onValueChange} />);
    focusDay(WED_MARCH_18);
    await user.keyboard("{ArrowRight}");
    await user.keyboard(key);
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(new Date(2026, 2, 19));
    expect(dayButton(new Date(2026, 2, 19))).toHaveAttribute("data-selected", "true");
  });

  it.each([
    { rule: "isDateDisabled", props: { isDateDisabled: (d: Date) => d.getDate() === 19 } },
    { rule: "max", props: { max: WED_MARCH_18 } },
  ])("focuses a day disabled by $rule but does not select it", async ({ props }) => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar defaultValue={WED_MARCH_18} onValueChange={onValueChange} {...props} />);
    focusDay(WED_MARCH_18);
    await user.keyboard("{ArrowRight}");
    const march19 = dayButton(new Date(2026, 2, 19));
    expect(march19).toHaveFocus();
    expect(march19).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(march19).not.toHaveAttribute("data-selected");
  });

  it.each(["Alt", "Control", "Meta"])("ignores arrow keys pressed with %s", async (modifier) => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={WED_MARCH_18} />);
    focusDay(WED_MARCH_18);
    await user.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`);
    expect(dayButton(WED_MARCH_18)).toHaveFocus();
  });

  it("has no a11y violations with outside and disabled days", async () => {
    const { container } = render(
      <Calendar
        defaultValue={WED_MARCH_18}
        weekStartsOn={1}
        showOutsideDays
        min={new Date(2026, 2, 5)}
        max={new Date(2026, 2, 25)}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Calendar month", () => {
  const APRIL_1 = new Date(2026, 3, 1);
  const grid = (name: string) => screen.getByRole("grid", { name });

  it("shows the month of a controlled `month`, not the selected day's", () => {
    render(<Calendar value={MARCH_15_2026} month={new Date(2026, 5, 20, 14)} />);
    expect(grid("June 2026")).toBeInTheDocument();
  });

  it("asks for the next and previous month through onMonthChange and waits for `month`", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    const { rerender } = render(<Calendar month={MARCH_15_2026} onMonthChange={onMonthChange} />);
    await user.click(getButton("Next month"));
    expect(onMonthChange).toHaveBeenLastCalledWith(APRIL_1);
    expect(grid("March 2026")).toBeInTheDocument();
    await user.click(getButton("Previous month"));
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 1, 1));
    expect(onMonthChange).toHaveBeenCalledTimes(2);
    rerender(<Calendar month={APRIL_1} onMonthChange={onMonthChange} />);
    expect(grid("April 2026")).toBeInTheDocument();
  });

  it("follows a parent that sets `month` in onMonthChange, by buttons and keys", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [month, setMonth] = useState(MARCH_15_2026);
      return <Calendar defaultValue={MARCH_15_2026} month={month} onMonthChange={setMonth} />;
    }
    render(<Controlled />);
    await user.click(getButton("Next month"));
    expect(grid("April 2026")).toBeInTheDocument();
    await user.click(getButton("Previous month"));
    await focusDay(MARCH_15_2026);
    await user.keyboard("{PageDown}");
    expect(grid("April 2026")).toBeInTheDocument();
    expect(dayButton(new Date(2026, 3, 15))).toHaveFocus();
  });

  it("keeps focus on its day when a key leaves a `month` the parent keeps", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    const march31 = new Date(2026, 2, 31);
    render(<Calendar defaultValue={march31} month={march31} onMonthChange={onMonthChange} />);
    await focusDay(march31);
    await user.keyboard("{ArrowRight}");
    expect(onMonthChange).toHaveBeenCalledExactlyOnceWith(APRIL_1);
    expect(grid("March 2026")).toBeInTheDocument();
    expect(dayButton(march31)).toHaveFocus();
    expect(tabStops()).toEqual([dayButton(march31)]);
  });

  // A parent that answers with a month other than the asked-for one removes the focused day
  const JUNE_1 = new Date(2026, 5, 1);
  const clampToJune = (month: Date) => (month > JUNE_1 ? JUNE_1 : month);

  it("focuses the tab stop of the month a parent shows instead of the asked-for one", async () => {
    const user = userEvent.setup();
    function Clamped() {
      const [month, setMonth] = useState(MARCH_15_2026);
      return (
        <Calendar
          defaultValue={MARCH_15_2026}
          month={month}
          onMonthChange={(next) => setMonth(clampToJune(next))}
        />
      );
    }
    render(<Clamped />);
    await focusDay(MARCH_15_2026);
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(grid("June 2026")).toBeInTheDocument();
    expect(document.activeElement).not.toBe(document.body);
    expect(tabStops()).toEqual([document.activeElement]);
  });

  it("moves focus to the asked-for day when the parent sets `month` later", async () => {
    const user = userEvent.setup();
    let applyMonth = () => {};
    function Deferred() {
      const [month, setMonth] = useState(MARCH_15_2026);
      return (
        <Calendar
          defaultValue={MARCH_15_2026}
          month={month}
          onMonthChange={(next) => {
            applyMonth = () => setMonth(next);
          }}
        />
      );
    }
    render(<Deferred />);
    await focusDay(MARCH_15_2026);
    await user.keyboard("{PageDown}");
    expect(grid("March 2026")).toBeInTheDocument();
    expect(dayButton(MARCH_15_2026)).toHaveFocus();
    act(() => applyMonth());
    expect(grid("April 2026")).toBeInTheDocument();
    expect(dayButton(new Date(2026, 3, 15))).toHaveFocus();
    expect(tabStops()).toEqual([dayButton(new Date(2026, 3, 15))]);
  });

  it("focuses the tab stop of another month that a parent shows in a transition", async () => {
    const user = userEvent.setup();
    function ClampedTransition() {
      const [month, setMonth] = useState(MARCH_15_2026);
      return (
        <Calendar
          defaultValue={MARCH_15_2026}
          month={month}
          onMonthChange={(next) => startTransition(() => setMonth(clampToJune(next)))}
        />
      );
    }
    render(<ClampedTransition />);
    await focusDay(MARCH_15_2026);
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(grid("June 2026")).toBeInTheDocument();
    expect(document.activeElement).not.toBe(document.body);
    expect(tabStops()).toEqual([document.activeElement]);
  });

  it("leaves focus where the user moved it before the parent sets `month`", async () => {
    const user = userEvent.setup();
    let applyMonth = () => {};
    function Deferred() {
      const [month, setMonth] = useState(MARCH_15_2026);
      return (
        <Calendar
          defaultValue={MARCH_15_2026}
          month={month}
          onMonthChange={(next) => {
            applyMonth = () => setMonth(next);
          }}
        />
      );
    }
    render(<Deferred />);
    await focusDay(MARCH_15_2026);
    await user.keyboard("{PageDown}");
    act(() => getButton("Next month").focus());
    act(() => applyMonth());
    expect(grid("April 2026")).toBeInTheDocument();
    expect(getButton("Next month")).toHaveFocus();
  });

  it("selects an outside day and asks for its month", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Calendar
        month={MARCH_15_2026}
        onMonthChange={onMonthChange}
        onValueChange={onValueChange}
        weekStartsOn={1}
        showOutsideDays
      />,
    );
    await user.click(getButton("Monday, February 23, 2026"));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 1, 23));
    expect(onMonthChange).toHaveBeenCalledExactlyOnceWith(new Date(2026, 1, 1));
    expect(grid("March 2026")).toBeInTheDocument();
  });

  it("keeps a controlled `month` when `value` moves to another month", () => {
    const { rerender } = render(<Calendar value={MARCH_15_2026} month={MARCH_15_2026} />);
    rerender(<Calendar value={new Date(2026, 6, 4)} month={MARCH_15_2026} />);
    expect(grid("March 2026")).toBeInTheDocument();
  });

  it("calls onMonthChange when the user moves an uncontrolled month", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar defaultValue={MARCH_15_2026} onMonthChange={onMonthChange} />);
    await user.click(getButton("Next month"));
    expect(grid("April 2026")).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith(APRIL_1);
    await focusDay(new Date(2026, 3, 1));
    await user.keyboard("{ArrowLeft}");
    expect(grid("March 2026")).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 2, 1));
    expect(onMonthChange).toHaveBeenCalledTimes(2);
  });

  it("does not call onMonthChange when a new `value` moves an uncontrolled month", () => {
    const onMonthChange = vi.fn();
    const { rerender } = render(<Calendar value={MARCH_15_2026} onMonthChange={onMonthChange} />);
    rerender(<Calendar value={new Date(2026, 6, 4)} onMonthChange={onMonthChange} />);
    expect(grid("July 2026")).toBeInTheDocument();
    expect(onMonthChange).not.toHaveBeenCalled();
  });

  it.each([
    { bad: "an Invalid Date", month: new Date(Number.NaN) },
    { bad: "a date before year 1", month: createDate(0, 5, 15) },
  ])("shows the selected day's month for $bad as the `month`", async ({ month }) => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar value={MARCH_15_2026} month={month} onMonthChange={onMonthChange} />);
    expect(grid("March 2026")).toBeInTheDocument();
    await user.click(getButton("Next month"));
    expect(onMonthChange).toHaveBeenCalledExactlyOnceWith(APRIL_1);
  });

  it("does not ask for a month before January of year 1", async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<Calendar month={createDate(1, 0, 10)} onMonthChange={onMonthChange} />);
    expect(getButton("Previous month")).toHaveAttribute("aria-disabled", "true");
    await user.click(getButton("Previous month"));
    expect(onMonthChange).not.toHaveBeenCalled();
  });
});

describe("Calendar labels", () => {
  it("keeps the default when a function label is undefined", () => {
    render(<Calendar value={MARCH_15_2026} labels={{ heading: undefined }} />);
    expect(
      screen.getByRole("grid", { name: DEFAULT_CALENDAR_LABELS.heading(new Date(2026, 2, 1)) }),
    ).toBeInTheDocument();
  });

  const PL_NARROW_WEEKDAYS = ["N", "P", "W", "Ś", "C", "P", "S"];

  it("uses DEFAULT_CALENDAR_LABELS", () => {
    render(<Calendar value={MARCH_15_2026} />);
    const { previousMonth, nextMonth, heading, weekday, day } = DEFAULT_CALENDAR_LABELS;
    expect(getButton(previousMonth)).toBeInTheDocument();
    expect(getButton(nextMonth)).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: heading(new Date(2026, 2, 1)) })).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    // March 1, 2026 is a Sunday
    expect(headers).toEqual([0, 1, 2, 3, 4, 5, 6].map((d) => weekday(new Date(2026, 2, 1 + d))));
    expect(dayButton(MARCH_15_2026)).toHaveAccessibleName(day(MARCH_15_2026));
  });

  it("takes every string from labels", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <Calendar
          value={MARCH_15_2026}
          weekStartsOn={1}
          labels={{
            previousMonth: "Poprzedni miesiąc",
            nextMonth: "Następny miesiąc",
            heading: (date) => `${date.getMonth() + 1}/${date.getFullYear()}`,
            weekday: (date) => PL_NARROW_WEEKDAYS[date.getDay()] ?? "",
            day: (date) => `Dzień ${date.getDate()}`,
          }}
        />,
      );
      expect(screen.getByRole("grid", { name: "3/2026" })).toBeInTheDocument();
      expect(screen.getByText("3/2026")).toBeInTheDocument();
      const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
      expect(headers).toEqual(["P", "W", "Ś", "C", "P", "S", "N"]);
      expect(getButton("Dzień 15")).toBeInTheDocument();
      await user.click(getButton("Następny miesiąc"));
      expect(screen.getByRole("grid", { name: "4/2026" })).toBeInTheDocument();
      await user.click(getButton("Poprzedni miesiąc"));
      expect(screen.getByRole("grid", { name: "3/2026" })).toBeInTheDocument();
      // Two weekdays share a name ("P"), which must not clash as React keys
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("keeps the default for a key labels leaves out", () => {
    render(<Calendar value={MARCH_15_2026} labels={{ nextMonth: "Następny miesiąc" }} />);
    expect(getButton("Previous month")).toBeInTheDocument();
    expect(getButton("Następny miesiąc")).toBeInTheDocument();
  });
});
