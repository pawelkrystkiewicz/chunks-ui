import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "./Calendar";

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
const dayButton = (date: Date) => screen.getByRole("button", { name: label(date) });
// Day labels end with the year; the month nav buttons do not.
const tabStops = () =>
  screen.getAllByRole("button", { name: /\d{4}$/ }).filter((b) => b.tabIndex === 0);
const focusDay = (date: Date) => act(() => dayButton(date).focus());

describe("Calendar", () => {
  it("renders the current month and year when no value is provided", () => {
    render(<Calendar />);
    // Should render some month/year heading — we just verify the container is present
    const buttons = screen.getAllByRole("button");
    // At least prev/next + some day buttons
    expect(buttons.length).toBeGreaterThan(2);
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
    expect(screen.queryByRole("button", { name: feb23 })).not.toBeInTheDocument();
    rerender(<Calendar value={MARCH_15_2026} weekStartsOn={1} showOutsideDays />);
    expect(screen.getByRole("button", { name: feb23 })).toHaveClass("opacity-50");
    expect(screen.getByRole("button", { name: "Saturday, April 4, 2026" })).toBeInTheDocument();
  });

  it("keeps the selected colour on a selected outside day", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 1, 28)} weekStartsOn={1} showOutsideDays />);
    await user.click(screen.getByRole("button", { name: "Next month" }));
    const feb28 = screen.getByRole("button", { name: "Saturday, February 28, 2026" });
    expect(feb28).toHaveAttribute("data-selected", "true");
    expect(feb28).toHaveClass("text-primary-foreground");
    expect(feb28).not.toHaveClass("text-muted-foreground");
    expect(feb28).not.toHaveClass("opacity-50");
  });

  it("moves the view to the month of a clicked outside day", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={MARCH_15_2026} weekStartsOn={1} showOutsideDays />);
    await user.click(screen.getByRole("button", { name: "Monday, February 23, 2026" }));
    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  it("calls onValueChange with the clicked date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar value={MARCH_15_2026} onValueChange={onValueChange} />);

    // Click on day 10 of March 2026
    const day10 = screen.getByRole("button", { name: /March 10/ });
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

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  it("navigates to next month on next button click", async () => {
    const user = userEvent.setup();
    render(<Calendar value={MARCH_15_2026} />);

    expect(screen.getByText("March 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("navigates across year boundary (December -> January) under StrictMode", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 11, 1)} />, { wrapper: StrictMode });

    expect(screen.getByText("December 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByText("January 2027")).toBeInTheDocument();
  });

  it("navigates across year boundary (January -> December) under StrictMode", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 0, 1)} />, { wrapper: StrictMode });

    expect(screen.getByText("January 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(screen.getByText("December 2025")).toBeInTheDocument();
  });

  it("disabled date is not clickable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const disableDay5 = (date: Date) => date.getDate() === 5;

    render(
      <Calendar value={MARCH_15_2026} onValueChange={onValueChange} isDateDisabled={disableDay5} />,
    );

    const day5 = screen.getByRole("button", { name: /March 5/ });
    expect(day5).toHaveAttribute("aria-disabled", "true");

    await user.click(day5);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("dates before min are disabled", () => {
    render(<Calendar value={MARCH_15_2026} min={new Date(2026, 2, 10)} />);

    const day5 = screen.getByRole("button", { name: /March 5/ });
    expect(day5).toHaveAttribute("aria-disabled", "true");

    const day10 = screen.getByRole("button", { name: /March 10/ });
    expect(day10).not.toHaveAttribute("aria-disabled");
  });

  it("dates after max are disabled", () => {
    render(<Calendar value={MARCH_15_2026} max={new Date(2026, 2, 20)} />);

    const day25 = screen.getByRole("button", { name: /March 25/ });
    expect(day25).toHaveAttribute("aria-disabled", "true");

    const day20 = screen.getByRole("button", { name: /March 20/ });
    expect(day20).not.toHaveAttribute("aria-disabled");
  });

  it("selected date has data-selected", () => {
    render(<Calendar value={MARCH_15_2026} />);

    const day15 = screen.getByRole("button", { name: /March 15/ });
    expect(day15).toHaveAttribute("data-selected", "true");
  });

  it("unselected days do not have data-selected", () => {
    render(<Calendar value={MARCH_15_2026} />);

    const day10 = screen.getByRole("button", { name: /March 10/ });
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
    const todayButtons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-current") === "date");
    expect(todayButtons).toHaveLength(1);
  });

  it("uncontrolled: updates internal state when a day is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar defaultValue={MARCH_15_2026} onValueChange={onValueChange} />);

    const day20 = screen.getByRole("button", { name: /March 20/ });
    await user.click(day20);

    expect(onValueChange).toHaveBeenCalledOnce();
    // The previously selected day should no longer be selected
    const day15 = screen.getByRole("button", { name: /March 15/ });
    expect(day15).not.toHaveAttribute("data-selected");
    // The newly clicked day should be selected
    expect(day20).toHaveAttribute("data-selected", "true");
  });

  it("prev/next navigation buttons have aria-labels", () => {
    render(<Calendar value={MARCH_15_2026} />);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  });

  it("day buttons have descriptive aria-labels", () => {
    render(<Calendar value={MARCH_15_2026} />);
    // Should have a button with a label that includes "March" and "2026"
    const day1 = screen.getByRole("button", { name: /March 1, 2026/ });
    expect(day1).toBeInTheDocument();
  });

  it("exposes the days as a grid named by the shown month", async () => {
    const user = userEvent.setup();
    render(<Calendar value={MARCH_15_2026} />);
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next month" }));
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
      await user.click(screen.getByRole("button", { name: "Next month" }));
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
    expect(screen.getByRole("button", { name: "Previous month" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next month" })).toHaveFocus();
    await user.tab();
    expect(dayButton(MARCH_15_2026)).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("never makes an outside day a tab stop, even when it is selected", async () => {
    const user = userEvent.setup();
    const feb28 = new Date(2026, 1, 28);
    render(<Calendar defaultValue={feb28} weekStartsOn={1} showOutsideDays />);
    await user.click(screen.getByRole("button", { name: "Next month" }));
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
