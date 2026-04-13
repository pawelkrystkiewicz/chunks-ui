import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

afterEach(cleanup);

const Icon = () => (
  <svg aria-hidden="true" data-testid="icon" viewBox="0 0 24 24">
    <title>icon</title>
  </svg>
);

describe("IconButton", () => {
  it("renders the child icon", () => {
    render(
      <IconButton aria-label="Do thing">
        <Icon />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Do thing" })).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <IconButton aria-label="x" className="custom">
        <Icon />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("applies compound variant classes", () => {
    render(
      <IconButton aria-label="x" variant="contained" color="primary">
        <Icon />
      </IconButton>,
    );
    expect(screen.getByRole("button")).toHaveClass("bg-primary");
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="x" onClick={onClick}>
        <Icon />
      </IconButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <IconButton aria-label="Do thing">
        <Icon />
      </IconButton>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
