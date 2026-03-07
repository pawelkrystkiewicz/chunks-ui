import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders clear button when onClear is provided", async () => {
    const onClear = vi.fn();
    render(<Input onClear={onClear} data-testid="inp" />);
    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await userEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("prefers clear button over end adornment", () => {
    const onClear = vi.fn();
    render(<Input onClear={onClear} endAdornment={<span data-testid="end" />} data-testid="inp" />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.queryByTestId("end")).not.toBeInTheDocument();
  });
});
