import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { ClearButton, type ClearButtonLabels, DEFAULT_CLEAR_BUTTON_LABELS } from "./ClearButton";

afterEach(cleanup);

describe("ClearButton", () => {
  it("renders with default label", () => {
    render(<ClearButton />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<ClearButton label="Remove" />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("calls onClick handler", async () => {
    const onClick = vi.fn();
    render(<ClearButton onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges custom className", () => {
    render(<ClearButton className="custom" />);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("has type=button", () => {
    render(<ClearButton />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<ClearButton label="Clear" onClick={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ClearButton labels", () => {
  it("types DEFAULT_CLEAR_BUTTON_LABELS as read-only", () => {
    expectTypeOf(DEFAULT_CLEAR_BUTTON_LABELS).toEqualTypeOf<Readonly<ClearButtonLabels>>();
  });

  it("is named by DEFAULT_CLEAR_BUTTON_LABELS", () => {
    render(<ClearButton />);
    expect(
      screen.getByRole("button", { name: DEFAULT_CLEAR_BUTTON_LABELS.clear }),
    ).toBeInTheDocument();
  });

  it("takes its name from labels", () => {
    render(<ClearButton labels={{ clear: "Wyczyść" }} />);
    expect(screen.getByRole("button", { name: "Wyczyść" })).toBeInTheDocument();
  });

  it.each([
    ["label", { label: "Remove" }],
    ["aria-label", { "aria-label": "Remove" }],
  ])("prefers %s over labels", (_prop, props) => {
    render(<ClearButton labels={{ clear: "Wyczyść" }} {...props} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
