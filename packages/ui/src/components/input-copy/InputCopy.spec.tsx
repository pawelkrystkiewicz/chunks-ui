import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { DEFAULT_INPUT_COPY_LABELS, InputCopy, type InputCopyLabels } from "./InputCopy";

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

describe("InputCopy labels", () => {
  it("types DEFAULT_INPUT_COPY_LABELS as read-only", () => {
    expectTypeOf(DEFAULT_INPUT_COPY_LABELS).toEqualTypeOf<Readonly<InputCopyLabels>>();
  });

  it("names the copy button Copied after a copy", async () => {
    const user = userEvent.setup();
    render(<InputCopy value="code" />);
    await user.click(screen.getByRole("button", { name: DEFAULT_INPUT_COPY_LABELS.copy }));
    expect(
      screen.getByRole("button", { name: DEFAULT_INPUT_COPY_LABELS.copied }),
    ).toBeInTheDocument();
  });

  it("takes the copy button's names from labels", async () => {
    const user = userEvent.setup();
    render(<InputCopy value="code" labels={{ copy: "Kopiuj", copied: "Skopiowano" }} />);
    await user.click(screen.getByRole("button", { name: "Kopiuj" }));
    expect(screen.getByRole("button", { name: "Skopiowano" })).toBeInTheDocument();
  });
});
