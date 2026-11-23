import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { buttonVariants } from "./Button.Variants";

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

  it("keeps focus when loading even if focusableWhenDisabled is false", () => {
    render(
      <Button loading focusableWhenDisabled={false}>
        Wait
      </Button>,
    );
    const btn = screen.getByRole("button");
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it("keeps focus and drops the native disabled attribute with focusableWhenDisabled", () => {
    render(
      <Button disabled focusableWhenDisabled>
        Wait
      </Button>,
    );
    const btn = screen.getByRole("button");
    btn.focus();
    expect(btn).toHaveFocus();
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn).not.toHaveAttribute("disabled");
  });

  it("does not call onClick when disabled and focusable", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled focusableWhenDisabled onClick={onClick}>
        Wait
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  describe("implicit form submission", () => {
    const renderForm = (buttonProps: { disabled?: boolean; focusableWhenDisabled?: boolean }) => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <input aria-label="Name" />
          <Button type="submit" {...buttonProps}>
            Send
          </Button>
        </form>,
      );
      return onSubmit;
    };

    it("submits on Enter when the button is enabled", async () => {
      const onSubmit = renderForm({});
      await userEvent.type(screen.getByRole("textbox"), "{Enter}");
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("does not submit on Enter when the button is disabled and focusable", async () => {
      const onSubmit = renderForm({ disabled: true, focusableWhenDisabled: true });
      await userEvent.type(screen.getByRole("textbox"), "{Enter}");
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>No</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("dims through data-disabled and native :disabled", () => {
    const classes = buttonVariants().split(" ");
    expect(classes).toEqual(
      expect.arrayContaining([
        "data-disabled:pointer-events-none",
        "data-disabled:opacity-50",
        "disabled:pointer-events-none",
        "disabled:opacity-50",
      ]),
    );
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
