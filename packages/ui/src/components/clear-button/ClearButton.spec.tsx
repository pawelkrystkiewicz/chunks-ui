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

  // Both offsets are in one tailwind-merge group under the same variant: the consumer's wins
  it("keeps a flush ring with focus-visible:outline-offset-0 in className", () => {
    render(<ClearButton className="focus-visible:outline-offset-0" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "focus-visible:outline-offset-0",
      "focus-visible:outline-2",
      "focus-visible:outline-ring",
    );
    expect(button).not.toHaveClass("focus-visible:outline-offset-2");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<ClearButton labels={{ clear: "Remove" }} onClick={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// The X is only the default content: children replace it, and the button keeps its name (#564)
describe("ClearButton content", () => {
  it("renders the X when it has no children", () => {
    render(<ClearButton />);
    const x = screen.getByRole("button", { name: DEFAULT_CLEAR_BUTTON_LABELS.clear });
    expect(x.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  // An icon with aria-hidden, the intended use: text children would need an aria-label that
  // contains them, as the default name does not
  it("renders its children in place of the X, under the same name", () => {
    render(
      <ClearButton>
        <svg data-testid="custom" aria-hidden="true" />
      </ClearButton>,
    );
    const button = screen.getByRole("button", { name: DEFAULT_CLEAR_BUTTON_LABELS.clear });
    expect(button.children).toHaveLength(1);
    expect(button.firstElementChild).toBe(screen.getByTestId("custom"));
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

describe("ClearButton aria-disabled", () => {
  it.each([
    ["true", "true"],
    ["boolean true", true],
  ] as const)("ignores a click while aria-disabled is %s", async (_name, value) => {
    const onClick = vi.fn();
    render(<ClearButton aria-disabled={value} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("prevents the default of a click while aria-disabled", () => {
    render(<ClearButton aria-disabled="true" onClick={() => {}} />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("button").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("ignores %s on the focused button while aria-disabled", async (_name, keys) => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ClearButton aria-disabled="true" onClick={onClick} />);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard(keys);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it.each([
    ["aria-disabled=false", { "aria-disabled": "false" }],
    ["no aria-disabled", {}],
  ] as const)("still calls onClick with %s", async (_name, props) => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ClearButton {...props} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });
});
