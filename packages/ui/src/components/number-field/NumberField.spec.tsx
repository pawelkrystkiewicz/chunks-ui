import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberField } from "./NumberField";

afterEach(cleanup);

// Base UI NumberField renders the input as role="textbox" with aria-roledescription="Number field"
function BasicNumberField(props: Partial<React.ComponentProps<typeof NumberField.Root>> = {}) {
  return (
    <NumberField.Root defaultValue={0} {...props}>
      <NumberField.Group>
        <NumberField.Decrement aria-label="Decrement" />
        <NumberField.Input />
        <NumberField.Increment aria-label="Increment" />
      </NumberField.Group>
    </NumberField.Root>
  );
}

describe("NumberField", () => {
  it("renders all sub-components", () => {
    render(<BasicNumberField />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increment" })).toBeInTheDocument();
  });

  it("displays the default value", () => {
    render(<BasicNumberField defaultValue={42} />);
    expect(screen.getByRole("textbox")).toHaveValue("42");
  });

  it("merges custom className on Root", () => {
    render(<BasicNumberField className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Group", () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Group className="custom" data-testid="group">
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(screen.getByTestId("group")).toHaveClass("custom");
  });

  it("increments value when Increment button is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={5} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByRole("textbox")).toHaveValue("6");
  });

  it("decrements value when Decrement button is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={5} />);
    await user.click(screen.getByRole("button", { name: "Decrement" }));
    expect(screen.getByRole("textbox")).toHaveValue("4");
  });

  it("calls onValueChange when value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicNumberField defaultValue={0} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("renders ScrubArea when provided", () => {
    render(
      <NumberField.Root defaultValue={0}>
        <NumberField.ScrubArea data-testid="scrub">
          <NumberField.ScrubAreaCursor />
        </NumberField.ScrubArea>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(screen.getByTestId("scrub")).toBeInTheDocument();
  });

  it("respects max constraint (does not increment beyond max)", async () => {
    const user = userEvent.setup();
    render(<BasicNumberField defaultValue={10} max={10} />);
    await user.click(screen.getByRole("button", { name: "Increment" }));
    expect(screen.getByRole("textbox")).toHaveValue("10");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <NumberField.Root defaultValue={0}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
