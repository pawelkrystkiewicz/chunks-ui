import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "./DatePicker";

// Stub Calendar so tests don't depend on it
vi.mock("../calendar/Calendar", () => ({
  Calendar: ({
    value,
    onValueChange,
  }: {
    value?: Date | null;
    onValueChange?: (date: Date | null) => void;
  }) => (
    <div data-testid="calendar">
      {value && <span>{value.toISOString()}</span>}
      <button type="button" onClick={() => onValueChange?.(new Date(2026, 2, 15))}>
        Select March 15
      </button>
    </div>
  ),
}));

afterEach(cleanup);

describe("DatePicker", () => {
  it("renders trigger button with placeholder", () => {
    render(<DatePicker placeholder="Choose a date" />);
    expect(screen.getByRole("button", { name: "Choose a date" })).toBeInTheDocument();
  });

  it("renders with default placeholder when none provided", () => {
    render(<DatePicker />);
    expect(screen.getByRole("button", { name: "Pick a date" })).toBeInTheDocument();
  });

  it("displays formatted date when value is provided", () => {
    render(<DatePicker value={new Date(2026, 2, 15)} />);
    expect(screen.getByRole("button", { name: "March 15, 2026" })).toBeInTheDocument();
  });

  it("displays formatted date when defaultValue is provided", () => {
    render(<DatePicker defaultValue={new Date(2026, 0, 1)} />);
    expect(screen.getByRole("button", { name: "January 1, 2026" })).toBeInTheDocument();
  });

  it("shows placeholder text when value is null", () => {
    render(<DatePicker value={null} />);
    expect(screen.getByRole("button", { name: "Pick a date" })).toBeInTheDocument();
  });

  it("calls onValueChange and closes popover when calendar selects a date", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Pick a date" }));
    await userEvent.click(screen.getByRole("button", { name: "Select March 15" }));
    expect(onValueChange).toHaveBeenCalledOnce();
    const called = onValueChange.mock.calls[0]?.[0] as Date;
    expect(called.getFullYear()).toBe(2026);
    expect(called.getMonth()).toBe(2);
    expect(called.getDate()).toBe(15);
  });

  it("updates displayed date after uncontrolled selection", async () => {
    render(<DatePicker />);
    await userEvent.click(screen.getByRole("button", { name: "Pick a date" }));
    await userEvent.click(screen.getByRole("button", { name: "Select March 15" }));
    expect(screen.getByRole("button", { name: "March 15, 2026" })).toBeInTheDocument();
  });

  it("does not update trigger text when controlled", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value={new Date(2026, 0, 1)} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "January 1, 2026" }));
    await userEvent.click(screen.getByRole("button", { name: "Select March 15" }));
    expect(screen.getByRole("button", { name: "January 1, 2026" })).toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("disables trigger when disabled prop is set", () => {
    render(<DatePicker disabled />);
    expect(screen.getByRole("button", { name: "Pick a date" })).toBeDisabled();
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<DatePicker className="my-custom" />);
    expect(container.firstChild).toHaveClass("my-custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<DatePicker value={new Date(2026, 2, 15)} />);
    expect(
      await axe(container, {
        rules: { "aria-command-name": { enabled: false } },
      }),
    ).toHaveNoViolations();
  });
});
