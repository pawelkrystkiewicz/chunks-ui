import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ChangeEvent, createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
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
      // Returns the value the event carried when it fired
      const onChange = vi.fn((e: ChangeEvent<HTMLInputElement>) => e.target.value);
      render(
        <Input
          aria-label="Search"
          defaultValue="abc"
          onClear={onClear}
          onChange={onChange}
          onValueChange={onValueChange}
        />,
      );
      await activate(user);
      const input = screen.getByRole("textbox");
      expect(onClear).toHaveBeenCalledOnce();
      expect(input).toHaveValue("");
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith("", expect.anything());
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveReturnedWith("");
      expect(document.activeElement).toBe(input);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });
  }

  describe("clearable", () => {
    it("shows the clear button on an uncontrolled input with text, without onClear", async () => {
      const user = userEvent.setup();
      render(<Input aria-label="Search" defaultValue="" clearable />);
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("clearable");
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
      await user.type(input, "abc");
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    });

    it("empties an uncontrolled input and calls onClear after onValueChange", async () => {
      const user = userEvent.setup();
      const calls: string[] = [];
      render(
        <Input
          aria-label="Search"
          defaultValue="abc"
          clearable
          onValueChange={(value) => calls.push(`onValueChange(${JSON.stringify(value)})`)}
          onClear={() => calls.push("onClear")}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(calls).toEqual(['onValueChange("")', "onClear"]);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it("empties a controlled input through onValueChange, then calls onClear", async () => {
      const user = userEvent.setup();
      const calls: string[] = [];
      function Controlled() {
        const [value, setValue] = useState("abc");
        return (
          <Input
            aria-label="Search"
            value={value}
            clearable
            onValueChange={(next) => {
              calls.push(`onValueChange(${JSON.stringify(next)})`);
              setValue(next);
            }}
            onClear={() => calls.push("onClear")}
          />
        );
      }
      render(<Controlled />);
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(calls).toEqual(['onValueChange("")', "onClear"]);
    });

    it("leaves a controlled input as it is when its handler keeps the value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Input aria-label="Search" value="abc" onValueChange={onValueChange} clearable />);
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onValueChange).toHaveBeenCalledWith("", expect.anything());
      expect(screen.getByRole("textbox")).toHaveValue("abc");
    });
  });

  // validationMode="onBlur" validates on every blur, so a clear must not blur the input
  it.each([
    ["clearable", { clearable: true }],
    ["onClear", { onClear: () => {} }],
  ])("keeps focus in the input without a blur when Clear is clicked (%s)", async (_, props) => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<Input aria-label="Search" defaultValue="abc" onBlur={onBlur} {...props} />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(document.activeElement).toBe(input);
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("validates a validationMode=onBlur field once, on the real blur, after a clear", async () => {
    const user = userEvent.setup();
    const validate = vi.fn(() => null);
    render(
      <>
        <Field.Root validationMode="onBlur" validate={validate}>
          <Field.Label>Search</Field.Label>
          <Input defaultValue="abc" clearable />
        </Field.Root>
        <button type="button">Elsewhere</button>
      </>,
    );
    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(validate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(validate).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith("", expect.anything());
  });

  it.each([
    ["onClear", { onClear: () => {} }],
    ["clearable", { clearable: true }],
  ])("hides the clear button on a disabled input (%s)", (_name, props) => {
    render(<Input aria-label="Search" defaultValue="abc" disabled {...props} />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it.each([
    ["onClear", { onClear: () => {} }],
    ["clearable", { clearable: true }],
  ])("hides the clear button on a read-only input (%s)", (_name, props) => {
    render(<Input aria-label="Search" defaultValue="abc" readOnly {...props} />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("leaves an input in a disabled Field as it is when Clear is clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Field.Root disabled>
        <Field.Label>Search</Field.Label>
        <Input defaultValue="abc" onClear={onClear} onValueChange={onValueChange} />
      </Field.Root>,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("textbox")).toHaveValue("abc");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

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

  it("hides the clear button after a clear even when the value was emptied without an event", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Search" ref={ref} defaultValue="abc" onClear={vi.fn()} />);
    // A programmatic write fires no event, so the clear itself writes no change
    if (ref.current) ref.current.value = "";
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("hides the clear button after a form reset to an empty default", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Input aria-label="Search" defaultValue="" onClear={vi.fn()} />
        <button type="reset">Reset</button>
      </form>,
    );
    await user.type(screen.getByRole("textbox"), "abc");
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument(),
    );
  });

  it("shows the clear button after a form reset to a non-empty default", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Input aria-label="Search" defaultValue="abc" onClear={vi.fn()} />
        <button type="reset">Reset</button>
      </form>,
    );
    await user.clear(screen.getByRole("textbox"));
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("textbox")).toHaveValue("abc");
    expect(await screen.findByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("forwards the consumer's ref to a clearable input", () => {
    const ref = createRef<HTMLElement>();
    render(<Input aria-label="Search" ref={ref} onClear={vi.fn()} />);
    expect(ref.current).toBe(screen.getByRole("textbox"));
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
    const { container } = render(
      <Input aria-label="Text input" defaultValue="abc" onClear={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
