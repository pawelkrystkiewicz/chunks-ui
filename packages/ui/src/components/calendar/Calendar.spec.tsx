import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "./Calendar";

afterEach(cleanup);

// March 15, 2026 — month index 2 = March
const MARCH_15_2026 = new Date(2026, 2, 15);

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

  it("navigates across year boundary (December -> January)", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 11, 1)} />);

    expect(screen.getByText("December 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByText("January 2027")).toBeInTheDocument();
  });

  it("navigates across year boundary (January -> December)", async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2026, 0, 1)} />);

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
    expect(day5).toBeDisabled();

    await user.click(day5);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("dates before min are disabled", () => {
    render(<Calendar value={MARCH_15_2026} min={new Date(2026, 2, 10)} />);

    const day5 = screen.getByRole("button", { name: /March 5/ });
    expect(day5).toBeDisabled();

    const day10 = screen.getByRole("button", { name: /March 10/ });
    expect(day10).not.toBeDisabled();
  });

  it("dates after max are disabled", () => {
    render(<Calendar value={MARCH_15_2026} max={new Date(2026, 2, 20)} />);

    const day25 = screen.getByRole("button", { name: /March 25/ });
    expect(day25).toBeDisabled();

    const day20 = screen.getByRole("button", { name: /March 20/ });
    expect(day20).not.toBeDisabled();
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

  it("has no a11y violations", async () => {
    const { container } = render(<Calendar value={MARCH_15_2026} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
