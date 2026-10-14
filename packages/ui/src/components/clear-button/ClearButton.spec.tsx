import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClearButton } from "./ClearButton";
import { DEFAULT_CLEAR_BUTTON_LABELS } from "./ClearButton.Labels";

afterEach(cleanup);

describe("ClearButton", () => {
  it("renders with default label", () => {
    render(<ClearButton />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  // Deprecated in favour of labels.clear, and still working
  it("renders with the deprecated label prop", () => {
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

  it("draws the X icon inline, hidden from assistive tech", () => {
    render(<ClearButton />);
    const icon = screen.getByRole("button").querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<ClearButton labels={{ clear: "Remove" }} onClick={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ClearButton labels", () => {
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

  it("ranks aria-label over label over labels", () => {
    render(<ClearButton label="A" aria-label="B" labels={{ clear: "C" }} />);
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
  });

  // An aria-label would be read again when the referenced element contains the button
  it("sets no default aria-label when aria-labelledby names it", () => {
    render(
      <>
        <span id="name">Remove filter</span>
        <ClearButton aria-labelledby="name" labels={{ clear: "Wyczyść" }} />
      </>,
    );
    const button = screen.getByRole("button", { name: "Remove filter" });
    expect(button).not.toHaveAttribute("aria-label");
  });

  it.each([
    ["label", { label: "Remove" }],
    ["aria-label", { "aria-label": "Remove" }],
  ])("keeps %s next to aria-labelledby", (_prop, props) => {
    render(
      <>
        <span id="name">Remove filter</span>
        <ClearButton aria-labelledby="name" {...props} />
      </>,
    );
    expect(screen.getByRole("button", { name: "Remove filter" })).toHaveAttribute(
      "aria-label",
      "Remove",
    );
  });
});
