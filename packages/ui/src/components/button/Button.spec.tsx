import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./Button";

afterEach(cleanup);

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Button className="custom">Ok</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("shows loader and hides icons when loading", () => {
    render(
      <Button loading startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    // focusableWhenDisabled makes it aria-disabled instead of native disabled
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByTestId("start")).not.toBeInTheDocument();
    expect(screen.queryByTestId("end")).not.toBeInTheDocument();
  });

  it("shows start and end icons when not loading", () => {
    render(
      <Button startIcon={<span data-testid="start" />} endIcon={<span data-testid="end" />}>
        Go
      </Button>,
    );
    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("is focusable when loading", () => {
    render(<Button loading>Wait</Button>);
    const btn = screen.getByRole("button");
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>No</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
