import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

afterEach(cleanup);

describe("Input", () => {
  it("renders a text input", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("merges custom className without adornments", () => {
    render(<Input className="custom" data-testid="inp" />);
    expect(screen.getByTestId("inp")).toHaveClass("custom");
  });

  it("renders with start adornment", () => {
    render(<Input startAdornment={<span data-testid="start">$</span>} data-testid="inp" />);
    expect(screen.getByTestId("start")).toBeInTheDocument();
  });

  it("renders with end adornment", () => {
    render(<Input endAdornment={<span data-testid="end">!</span>} data-testid="inp" />);
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("renders clear button when onClear is provided and value is non-empty", async () => {
    const onClear = vi.fn();
    render(<Input onClear={onClear} value="hello" data-testid="inp" />);
    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await userEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("hides clear button when there is no value", () => {
    render(<Input onClear={vi.fn()} data-testid="inp" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("hides clear button when the controlled value is empty", () => {
    render(<Input onClear={vi.fn()} value="" data-testid="inp" />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("shows clear button for an uncontrolled input with a default value", () => {
    render(<Input aria-label="Search" onClear={vi.fn()} defaultValue="abc" />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("shows clear button for an uncontrolled input after typing and hides it when emptied", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Search" onClear={vi.fn()} defaultValue="" />);
    const input = screen.getByRole("textbox");
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    await user.type(input, "abc");
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    await user.clear(input);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  const activations = {
    click: (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole("button", { name: "Clear" })),
    Enter: async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("textbox"));
      await user.tab();
      expect(screen.getByRole("button", { name: "Clear" })).toHaveFocus();
      await user.keyboard("{Enter}");
    },
  };

  for (const [how, activate] of Object.entries(activations)) {
    it(`clears a controlled input by ${how} and keeps focus on it`, async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      function Controlled() {
        const [value, setValue] = useState("abc");
        return (
          <Input
            aria-label="Search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClear={() => {
              onClear();
              setValue("");
            }}
          />
        );
      }
      render(<Controlled />);
      await activate(user);
      const input = screen.getByRole("textbox");
      expect(onClear).toHaveBeenCalledOnce();
      expect(input).toHaveValue("");
      expect(document.activeElement).toBe(input);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it(`clears an uncontrolled input by ${how} and keeps focus on it`, async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const onValueChange = vi.fn();
      render(
        <Input
          aria-label="Search"
          defaultValue="abc"
          onClear={onClear}
          onValueChange={onValueChange}
        />,
      );
      await activate(user);
      const input = screen.getByRole("textbox");
      expect(onClear).toHaveBeenCalledOnce();
      expect(input).toHaveValue("");
      expect(onValueChange).toHaveBeenLastCalledWith("", expect.anything());
      expect(document.activeElement).toBe(input);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });
  }

  it("takes new text after an uncontrolled input is cleared", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Search" defaultValue="" onClear={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "ab");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.keyboard("z");
    expect(input).toHaveValue("z");
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("keeps the consumer's ref and onValueChange on a clearable input", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLElement>();
    const onValueChange = vi.fn();
    render(<Input aria-label="Search" ref={ref} onClear={vi.fn()} onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox");
    expect(ref.current).toBe(input);
    await user.type(input, "a");
    expect(onValueChange).toHaveBeenCalledWith("a", expect.anything());
  });

  it("prefers clear button over end adornment when value is non-empty", () => {
    const onClear = vi.fn();
    render(
      <Input
        onClear={onClear}
        value="text"
        endAdornment={<span data-testid="end" />}
        data-testid="inp"
      />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.queryByTestId("end")).not.toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Input placeholder="Enter text" aria-label="Text input" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations with the clear button shown", async () => {
    const { container } = render(
      <Input aria-label="Search" defaultValue="abc" onClear={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
