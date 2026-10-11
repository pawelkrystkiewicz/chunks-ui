import { cleanup, isInaccessible, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
import { DatePicker } from "./DatePicker";

const MARCH_15_LABEL = "Sunday, March 15, 2026";

/**
 * The button with this aria-label, checked for what getByRole("button", { name }) checks: role,
 * accessible name, not hidden. With the calendar open, getByRole computes jsdom styles for every
 * day button it names, about 130ms a query under coverage on a laptop; this computes them for one.
 * `selector` leaves out any other element with that label, such as the grid named by its month.
 */
const getButton = (name: string) => {
  const button = screen.getByLabelText(name, { selector: "button" });
  expect(button).toHaveRole("button");
  expect(button).toHaveAccessibleName(name);
  expect(isInaccessible(button)).toBe(false);
  return button;
};

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
    await userEvent.click(getButton(MARCH_15_LABEL));
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(new Date(2026, 2, 15));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("updates displayed date after uncontrolled selection", async () => {
    render(<DatePicker />);
    await userEvent.click(screen.getByRole("button", { name: "Pick a date" }));
    await userEvent.click(getButton(MARCH_15_LABEL));
    expect(screen.getByRole("button", { name: "March 15, 2026" })).toBeInTheDocument();
  });

  it("does not update trigger text when controlled", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker value={new Date(2026, 0, 1)} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "January 1, 2026" }));
    await userEvent.click(getButton("Thursday, January 15, 2026"));
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
      expect(getButton(name)).toHaveAttribute("aria-disabled", "true");
    }
    expect(getButton(MARCH_15_LABEL)).not.toHaveAttribute("aria-disabled");
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
      const outsideDay = getButton(name);
      expect(outsideDay).toHaveClass("text-muted-foreground");
      expect(outsideDay).toHaveAttribute("tabindex", "-1");
    }
    // `hidden: true` skips the style check on every day. It can only let more buttons in: a
    // hidden tab stop would join the list and fail the comparison with the day getButton finds.
    const tabStops = within(screen.getByRole("grid"))
      .getAllByRole("button", { hidden: true })
      .filter((button) => button.tabIndex === 0);
    expect(tabStops).toEqual([getButton(MARCH_15_LABEL)]);
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
  const MARCH_15 = new Date(2026, 2, 15);

  // A button has no value of its own, so a label must not hide the date: the name keeps both
  it.each([
    {
      mode: "aria-label",
      ui: <DatePicker aria-label="Due date" defaultValue={MARCH_15} />,
      name: "Due date March 15, 2026",
    },
    {
      mode: "aria-label, no date",
      ui: <DatePicker aria-label="Due date" />,
      name: "Due date Pick a date",
    },
    {
      mode: "aria-labelledby",
      ui: (
        <>
          <span id="due-label">Due date</span>
          <DatePicker aria-labelledby="due-label" defaultValue={MARCH_15} />
        </>
      ),
      name: "Due date March 15, 2026",
    },
    {
      mode: "<label htmlFor>",
      ui: (
        <>
          <label htmlFor="due">Due date</label>
          <DatePicker id="due" defaultValue={MARCH_15} />
        </>
      ),
      name: "Due date March 15, 2026",
    },
    {
      mode: "Field.Label",
      ui: (
        <Field.Root>
          <Field.Label>Due date</Field.Label>
          <DatePicker defaultValue={MARCH_15} />
        </Field.Root>
      ),
      name: "Due date March 15, 2026",
    },
  ])("is named by its label, then the date or placeholder ($mode)", ({ ui, name }) => {
    render(ui);
    expect(screen.getByRole("button")).toHaveAccessibleName(name);
  });

  it("is named by its date alone when it has no label", () => {
    render(<DatePicker defaultValue={MARCH_15} />);
    expect(screen.getByRole("button")).toHaveAccessibleName("March 15, 2026");
  });

  it("forwards aria-describedby, other props and ref to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <>
        <span id="due-hint">Pick a weekday</span>
        <DatePicker ref={ref} aria-describedby="due-hint" data-testid="due-trigger" />
      </>,
    );
    const trigger = screen.getByRole("button");
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
    expect(trigger).toHaveAccessibleName("Due date Pick a date");
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
    await userEvent.click(getButton("Friday, October 2, 2026"));
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
    await userEvent.click(getButton(MARCH_15_LABEL));
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

  it("submits nothing and does not block the form inside a disabled Field.Root", () => {
    render(
      <form aria-label="Task">
        <Field.Root disabled>
          <Field.Label>Due date</Field.Label>
          <DatePicker name="due" required />
        </Field.Root>
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>("form");
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).has("due")).toBe(false);
  });

  it("submits under the Field.Root name when it has none of its own", () => {
    render(
      <form aria-label="Task">
        <Field.Root name="due">
          <Field.Label>Due date</Field.Label>
          <DatePicker defaultValue={new Date(2026, 2, 15)} />
        </Field.Root>
      </form>,
    );
    expect(formData(screen.getByRole<HTMLFormElement>("form"))).toBe("2026-03-15");
  });

  it("submits with the form named by `form` when it is outside that form", () => {
    render(
      <>
        <form id="task" aria-label="Task" />
        <DatePicker name="due" form="task" defaultValue={new Date(2026, 2, 15)} />
      </>,
    );
    expect(formData(screen.getByRole<HTMLFormElement>("form"))).toBe("2026-03-15");
  });

  it("takes onValueChange, not onChange, which the trigger never fires", () => {
    // @ts-expect-error onChange is not a DatePicker prop
    render(<DatePicker onChange={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders no form input without a name or required", () => {
    const { container } = render(<DatePicker defaultValue={new Date(2026, 2, 15)} />);
    expect(container.querySelector("input")).toBeNull();
  });
});

describe("DatePicker keyboard", () => {
  // Checks the focused element instead of querying every button by role and name: that query
  // computes jsdom styles for each day button, over half of each test's time, and timed out on CI.
  const expectFocused = (name: string) => {
    expect(document.activeElement).toHaveRole("button");
    expect(document.activeElement).toHaveAccessibleName(name);
  };

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
      await waitFor(() => expectFocused(expected));
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
    await waitFor(() => expectFocused(MARCH_15_LABEL));
    await user.keyboard("{ArrowRight}{PageDown}");
    expectFocused("Thursday, April 16, 2026");
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
    await waitFor(() => expectFocused(MARCH_15_LABEL));
    await user.keyboard("{ArrowDown}");
    expectFocused("Sunday, March 22, 2026");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("March 15, 2026");
  });
});
