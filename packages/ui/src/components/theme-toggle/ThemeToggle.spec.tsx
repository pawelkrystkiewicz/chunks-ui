import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "../tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { DEFAULT_THEME_TOGGLE_LABELS } from "./ThemeToggle.Labels";

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("renders with light theme", () => {
    render(<ThemeToggle theme="light" />);
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(button).toBeInTheDocument();
  });

  it("renders with dark theme", () => {
    render(<ThemeToggle theme="dark" />);
    const button = screen.getByRole("button", { name: "Switch to light mode" });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<ThemeToggle theme="light" onClick={handleClick} />);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders custom light icon", () => {
    render(<ThemeToggle theme="light" lightIcon={<span data-testid="custom-light" />} />);
    expect(screen.getByTestId("custom-light")).toBeInTheDocument();
  });

  it("renders custom dark icon", () => {
    render(<ThemeToggle theme="dark" darkIcon={<span data-testid="custom-dark" />} />);
    expect(screen.getByTestId("custom-dark")).toBeInTheDocument();
  });

  it("shows correct aria-label for light theme", () => {
    render(<ThemeToggle theme="light" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("shows correct aria-label for dark theme", () => {
    render(<ThemeToggle theme="dark" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to light mode");
  });

  it("both icons are always in the DOM", () => {
    const { container } = render(<ThemeToggle theme="light" />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
  });

  it("merges custom className", () => {
    render(<ThemeToggle theme="light" className="custom-class" />);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("forwards ref and button props", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ThemeToggle
        theme="dark"
        ref={ref}
        id="toggle"
        aria-describedby="hint"
        data-state="on"
        disabled
      />,
    );
    const button = screen.getByRole("button");
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("id", "toggle");
    expect(button).toHaveAttribute("aria-describedby", "hint");
    expect(button).toHaveAttribute("data-state", "on");
    expect(button).toBeDisabled();
  });

  it("lets aria-label override the default name", () => {
    render(<ThemeToggle theme="light" aria-label="Toggle theme" />);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("keeps its default name and type when aria-label and type are undefined", () => {
    render(<ThemeToggle theme="light" aria-label={undefined} type={undefined} />);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("opens a tooltip on focus as a Tooltip.Trigger render target", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip.Root>
        <Tooltip.Trigger render={<ThemeToggle theme="light" />} />
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Toggle theme</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveFocus();
    expect(await screen.findByText("Toggle theme")).toBeInTheDocument();
  });

  it("opens a tooltip on hover and keeps its onClick as a Tooltip.Trigger render target", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Tooltip.Root>
        <Tooltip.Trigger render={<ThemeToggle theme="light" onClick={handleClick} />} />
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Toggle theme</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    await user.hover(button);
    expect(await screen.findByText("Toggle theme")).toBeInTheDocument();
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<ThemeToggle theme="light" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ThemeToggle labels", () => {
  it("uses DEFAULT_THEME_TOGGLE_LABELS", () => {
    const { rerender } = render(<ThemeToggle theme="light" />);
    const { switchToDark, switchToLight } = DEFAULT_THEME_TOGGLE_LABELS;
    expect(screen.getByRole("button", { name: switchToDark })).toBeInTheDocument();
    rerender(<ThemeToggle theme="dark" />);
    expect(screen.getByRole("button", { name: switchToLight })).toBeInTheDocument();
  });

  it("takes both names from labels", () => {
    const labels = { switchToDark: "Włącz tryb ciemny", switchToLight: "Włącz tryb jasny" };
    const { rerender } = render(<ThemeToggle theme="light" labels={labels} />);
    expect(screen.getByRole("button", { name: "Włącz tryb ciemny" })).toBeInTheDocument();
    rerender(<ThemeToggle theme="dark" labels={labels} />);
    expect(screen.getByRole("button", { name: "Włącz tryb jasny" })).toBeInTheDocument();
  });

  it("prefers aria-label over labels", () => {
    render(<ThemeToggle theme="light" aria-label="Theme" labels={{ switchToDark: "Ciemny" }} />);
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  });
});
