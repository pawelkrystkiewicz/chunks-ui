import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chip } from "./Chip";

afterEach(cleanup);

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>Status</Chip>);
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <Chip className="custom" data-testid="chip">
        Tag
      </Chip>,
    );
    expect(screen.getByTestId("chip")).toHaveClass("custom");
  });

  it("shows remove button when onRemove is provided", async () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Tag</Chip>);
    const btn = screen.getByRole("button", { name: "Remove" });
    await userEvent.click(btn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("does not show remove button without onRemove", () => {
    render(<Chip>Tag</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Chip>Tag</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
