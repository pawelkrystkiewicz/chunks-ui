import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { DatePicker } from "./DatePicker";

const MARCH_15_LABEL = "Sunday, March 15, 2026";

beforeEach(() => {
  // Freeze "today" so the real Calendar opens on March 2026 when no date is selected.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 10, 12));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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
    await userEvent.click(screen.getByRole("button", { name: MARCH_15_LABEL }));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(new Date(2026, 2, 15));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("updates displayed date after uncontrolled selection", async () => {
    render(<DatePicker />);
    await userEvent.click(screen.getByRole("button", { name: "Pick a date" }));
    await userEvent.click(screen.getByRole("button", { name: MARCH_15_LABEL }));
    expect(screen.getByRole("button", { name: "March 15, 2026" })).toBeInTheDocument();
  });

  it("does not update trigger text when controlled", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value={new Date(2026, 0, 1)} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "January 1, 2026" }));
    await userEvent.click(screen.getByRole("button", { name: "Thursday, January 15, 2026" }));
    expect(screen.getByRole("button", { name: "January 1, 2026" })).toBeInTheDocument();
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("passes min, max and isDateDisabled to the calendar", async () => {
    render(
      <DatePicker
        defaultValue={new Date(2026, 2, 15)}
        min={new Date(2026, 2, 5)}
        max={new Date(2026, 2, 25)}
        isDateDisabled={(date) => date.getDate() === 13}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "March 15, 2026" }));
    for (const name of [
      "Wednesday, March 4, 2026",
      "Friday, March 13, 2026",
      "Thursday, March 26, 2026",
    ]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
    }
    expect(screen.getByRole("button", { name: MARCH_15_LABEL })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("starts the calendar week on Monday with weekStartsOn={1}", async () => {
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} weekStartsOn={1} />);
    await userEvent.click(screen.getByRole("button", { name: "March 15, 2026" }));
    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  });

  it("shows dimmed outside days, none of them a Tab stop, with showOutsideDays", async () => {
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} showOutsideDays />);
    await userEvent.click(screen.getByRole("button", { name: "March 15, 2026" }));
    // March 2026 ends on a Tuesday, so April 1–4 fill the last row.
    for (const name of [
      "Wednesday, April 1, 2026",
      "Thursday, April 2, 2026",
      "Friday, April 3, 2026",
      "Saturday, April 4, 2026",
    ]) {
      const outsideDay = screen.getByRole("button", { name });
      expect(outsideDay).toHaveClass("opacity-50");
      expect(outsideDay).toHaveAttribute("tabindex", "-1");
    }
    const tabStops = within(screen.getByRole("grid"))
      .getAllByRole("button")
      .filter((button) => button.tabIndex === 0);
    expect(tabStops).toEqual([screen.getByRole("button", { name: MARCH_15_LABEL })]);
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

describe("DatePicker labelling", () => {
  it("is named by aria-label", () => {
    render(<DatePicker aria-label="Due date" />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Due date");
  });

  it("is named by a <label> whose htmlFor matches its id", () => {
    render(
      <>
        <label htmlFor="due">Due date</label>
        <DatePicker id="due" />
      </>,
    );
    expect(screen.getByRole("button")).toHaveAccessibleName("Due date");
  });

  it("forwards aria-labelledby, aria-describedby, other props and ref to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <>
        <span id="due-label">Due date</span>
        <span id="due-hint">Pick a weekday</span>
        <DatePicker
          ref={ref}
          aria-labelledby="due-label"
          aria-describedby="due-hint"
          data-testid="due-trigger"
        />
      </>,
    );
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAccessibleName("Due date");
    expect(trigger).toHaveAccessibleDescription("Pick a weekday");
    expect(trigger).toHaveAttribute("data-testid", "due-trigger");
    expect(ref.current).toBe(trigger);
  });

  it("is named by Field.Label and described by Field.Description", () => {
    render(
      <Field.Root>
        <Field.Label>Due date</Field.Label>
        <DatePicker />
        <Field.Description>Pick a weekday</Field.Description>
      </Field.Root>,
    );
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAccessibleName("Due date");
    expect(trigger).toHaveAccessibleDescription("Pick a weekday");
  });

  it("has no a11y violations when labelled inside a Field in a form", async () => {
    const { container } = render(
      <form aria-label="Task">
        <Field.Root>
          <Field.Label>Due date</Field.Label>
          <DatePicker name="due" defaultValue={new Date(2026, 2, 15)} required />
        </Field.Root>
      </form>,
    );
    expect(
      await axe(container, {
        rules: { "aria-command-name": { enabled: false } },
      }),
    ).toHaveNoViolations();
  });
});

describe("DatePicker in a form", () => {
  const formData = (form: HTMLFormElement) => new FormData(form).get("due");

  it("submits the selected date as yyyy-mm-dd under its name", async () => {
    render(
      <form aria-label="Task">
        <DatePicker name="due" defaultValue={new Date(2026, 9, 10, 23, 59)} />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>("form");
    expect(formData(form)).toBe("2026-10-10");
    await userEvent.click(screen.getByRole("button", { name: "October 10, 2026" }));
    await userEvent.click(screen.getByRole("button", { name: "Friday, October 2, 2026" }));
    expect(formData(form)).toBe("2026-10-02");
  });

  it("submits an empty value when no date is selected", () => {
    render(
      <form aria-label="Task">
        <DatePicker name="due" />
      </form>,
    );
    expect(formData(screen.getByRole<HTMLFormElement>("form"))).toBe("");
  });

  it("submits the controlled value", () => {
    render(
      <form aria-label="Task">
        <DatePicker name="due" value={new Date(2026, 0, 5)} />
      </form>,
    );
    expect(formData(screen.getByRole<HTMLFormElement>("form"))).toBe("2026-01-05");
  });

  it("blocks submission while required and empty, and sends focus to the trigger", async () => {
    render(
      <form aria-label="Task">
        <DatePicker name="due" required />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>("form");
    expect(form.checkValidity()).toBe(false);
    // The browser focuses the first invalid control; the trigger takes that focus
    form.querySelector<HTMLInputElement>("input[name='due']")?.focus();
    expect(screen.getByRole("button", { name: "Pick a date" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Pick a date" }));
    await userEvent.click(screen.getByRole("button", { name: MARCH_15_LABEL }));
    expect(form.checkValidity()).toBe(true);
  });

  it("does not submit a value while disabled", () => {
    render(
      <form aria-label="Task">
        <DatePicker name="due" defaultValue={new Date(2026, 2, 15)} disabled />
      </form>,
    );
    expect(formData(screen.getByRole<HTMLFormElement>("form"))).toBeNull();
  });

  it("renders no form input without a name or required", () => {
    const { container } = render(<DatePicker defaultValue={new Date(2026, 2, 15)} />);
    expect(container.querySelector("input")).toBeNull();
  });
});

describe("DatePicker keyboard", () => {
  it.each([
    { stop: "the selected day", defaultValue: new Date(2026, 2, 15), expected: MARCH_15_LABEL },
    {
      stop: "today when nothing is selected",
      defaultValue: null,
      expected: "Tuesday, March 10, 2026",
    },
  ])("focuses $stop when opened", async ({ defaultValue, expected }) => {
    const user = userEvent.setup();
    render(<DatePicker defaultValue={defaultValue} />);
    const trigger = screen.getByRole("button");
    for (const open of [() => user.click(trigger), () => user.keyboard("{Enter}")]) {
      await open();
      await waitFor(() => expect(screen.getByRole("button", { name: expected })).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  });

  it("moves with arrow keys, and Enter selects, closes and refocuses the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("button", { name: MARCH_15_LABEL })).toHaveFocus());
    await user.keyboard("{ArrowRight}{PageDown}");
    expect(screen.getByRole("button", { name: "Thursday, April 16, 2026" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(new Date(2026, 3, 16));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "April 16, 2026" })).toHaveFocus(),
    );
  });

  it("closes on Escape without selecting and refocuses the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={new Date(2026, 2, 15)} onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button", { name: "March 15, 2026" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: MARCH_15_LABEL })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Sunday, March 22, 2026" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("March 15, 2026");
  });
});
