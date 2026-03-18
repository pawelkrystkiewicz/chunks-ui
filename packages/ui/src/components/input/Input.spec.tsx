import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

afterEach(cleanup);

describe("Input", () => {
  it("renders a text input", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("merges custom className without adornments", () => {
    render(<Input className="custom" data-testid="inp" />);
    expect(screen.getByTestId("inp")).toHaveClass("custom");
  });

  it("renders with start adornment", () => {
    render(<Input startAdornment={<span data-testid="start">$</span>} data-testid="inp" />);
    expect(screen.getByTestId("start")).toBeInTheDocument();
  });

  it("renders with end adornment", () => {
    render(<Input endAdornment={<span data-testid="end">!</span>} data-testid="inp" />);
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("renders clear button when onClear is provided and value is non-empty", async () => {
    const onClear = vi.fn();
    render(<Input onClear={onClear} value="hello" data-testid="inp" />);
    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await userEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("hides clear button when value is empty or undefined", () => {
    const onClear = vi.fn();
    const { rerender } = render(<Input onClear={onClear} data-testid="inp" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    rerender(<Input onClear={onClear} value="" data-testid="inp" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("prefers clear button over end adornment when value is non-empty", () => {
    const onClear = vi.fn();
    render(
      <Input
        onClear={onClear}
        value="text"
        endAdornment={<span data-testid="end" />}
        data-testid="inp"
      />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.queryByTestId("end")).not.toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Input placeholder="Enter text" aria-label="Text input" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
