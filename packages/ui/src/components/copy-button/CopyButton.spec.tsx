import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(cleanup);

describe("CopyButton", () => {
  it("renders a button", () => {
    render(<CopyButton value="test" aria-label="Copy" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("shows copied state after click", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="test" aria-label="Copy" />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("renders custom children with copied state", async () => {
    const user = userEvent.setup();
    render(
      <CopyButton value="test">
        {({ copied }) => <span>{copied ? "Done" : "Copy"}</span>}
      </CopyButton>,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("has type=button", () => {
    render(<CopyButton value="test" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("merges custom className", () => {
    render(<CopyButton value="test" className="custom" />);
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("calls onClick handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CopyButton value="test" onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<CopyButton value="test" aria-label="Copy to clipboard" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
