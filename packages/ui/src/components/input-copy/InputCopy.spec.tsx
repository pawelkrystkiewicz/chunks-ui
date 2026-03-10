import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputCopy } from "./InputCopy";

afterEach(cleanup);

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

describe("InputCopy", () => {
  it("renders an input with the value", () => {
    render(<InputCopy value="https://example.com" />);
    expect(screen.getByDisplayValue("https://example.com")).toBeInTheDocument();
  });

  it("is read-only by default", () => {
    render(<InputCopy value="code" />);
    expect(screen.getByDisplayValue("code")).toHaveAttribute("readonly");
  });

  it("includes a copy button", () => {
    render(<InputCopy value="code" />);
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<InputCopy value="code" className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<InputCopy value="test" aria-label="Copy link" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
