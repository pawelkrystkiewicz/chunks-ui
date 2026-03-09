import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

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

  it("has no a11y violations", async () => {
    const { container } = render(<ThemeToggle theme="light" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
