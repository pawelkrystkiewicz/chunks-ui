import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { type ChangeEvent, createRef, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { Field } from "../field";
import { FOCUS_RING } from "../shared";
import { Input } from "./Input";
import { DEFAULT_INPUT_LABELS } from "./Input.Labels";

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

    describe("on a controlled input without a handler", () => {
      let warn: MockInstance<typeof console.warn>;
      beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      });
      afterEach(() => warn.mockRestore());

      it("warns once in development that the clear button can't change the value", () => {
        const { rerender } = render(<Input aria-label="Search" value="abc" clearable />);
        rerender(<Input aria-label="Search" value="abcd" clearable />);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0]?.[0]).toMatch(/`clearable`.*`value`.*`onValueChange`/s);
      });

      it.each([
        ["onValueChange", { onValueChange: () => {} }],
        ["readOnly", { readOnly: true }],
        ["disabled", { disabled: true }],
      ])("does not warn with %s", (_, props) => {
        render(<Input aria-label="Search" value="abc" clearable {...props} />);
        expect(warn).not.toHaveBeenCalled();
      });

      it("does not warn on an uncontrolled input", () => {
        render(<Input aria-label="Search" defaultValue="abc" clearable />);
        expect(warn).not.toHaveBeenCalled();
      });
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

  // React Hook Form's reset() and setValue() write `input.value` directly, which fires no event
  it.each([
    { write: "empties", from: "abc", to: "", shows: false },
    { write: "fills", from: "", to: "abc", shows: true },
  ])(
    "follows a write that $write an uncontrolled input without an event, on the next render",
    async ({ from, to, shows }) => {
      const user = userEvent.setup();
      function ProgrammaticWrite() {
        const ref = useRef<HTMLInputElement>(null);
        const [, setRenders] = useState(0);
        const write = () => {
          if (ref.current) ref.current.value = to;
          setRenders((n) => n + 1);
        };
        return (
          <>
            <Input aria-label="Search" ref={ref} defaultValue={from} clearable />
            <button type="button" onClick={write}>
              Write
            </button>
          </>
        );
      }
      render(<ProgrammaticWrite />);
      await user.click(screen.getByRole("button", { name: "Write" }));
      expect(screen.getByRole("textbox")).toHaveValue(to);
      expect(screen.queryByRole("button", { name: "Clear" }) !== null).toBe(shows);
    },
  );

  it("forwards the consumer's ref to a clearable input", () => {
    const ref = createRef<HTMLElement>();
    render(<Input aria-label="Search" ref={ref} onClear={vi.fn()} />);
    expect(ref.current).toBe(screen.getByRole("textbox"));
  });

  // The end adornment stays in the DOM and hides by CSS, which jsdom doesn't load: the visual
  // spec checks that the button takes its place
  it("shows the clear button with an end adornment when value is non-empty", () => {
    render(<Input onClear={vi.fn()} value="text" endAdornment={<span data-testid="end" />} />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Input aria-label="Text input" defaultValue="abc" onClear={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Input labels", () => {
  it("names the clear button with DEFAULT_INPUT_LABELS", () => {
    render(<Input aria-label="Search" defaultValue="abc" onClear={vi.fn()} />);
    expect(screen.getByRole("button", { name: DEFAULT_INPUT_LABELS.clear })).toBeInTheDocument();
  });

  it("takes the clear button's name from labels", () => {
    render(
      <Input
        aria-label="Search"
        defaultValue="abc"
        onClear={vi.fn()}
        labels={{ clear: "Wyczyść" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Wyczyść" })).toBeInTheDocument();
  });

  it("does not pass labels to the input element", () => {
    render(<Input aria-label="Search" labels={{ clear: "Wyczyść" }} />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("labels");
  });
});

// The props the docs list under "Mobile Keyboards"
describe("Input mobile keyboard props", () => {
  it.each([
    ["without adornments", {}],
    ["with an adornment", { startAdornment: "$" }],
  ])("passes type, inputMode, enterKeyHint and autoComplete to the input %s", (_, props) => {
    render(
      <Input
        aria-label="Query"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        {...props}
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Query" });
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("inputmode", "search");
    expect(input).toHaveAttribute("enterkeyhint", "search");
    expect(input).toHaveAttribute("autocomplete", "off");
  });
});

describe("Input focus ring", () => {
  it("draws the library focus ring", () => {
    render(<Input data-testid="inp" />);
    expect(screen.getByTestId("inp")).toHaveClass(FOCUS_RING);
  });

  // With adornments a string className goes on the wrapper, so the opt-out takes a function
  it("keeps a flush ring with adornments through a className function", () => {
    render(
      <Input
        data-testid="inp"
        startAdornment={<span>$</span>}
        className={() => "focus-visible:outline-offset-0"}
      />,
    );
    const input = screen.getByTestId("inp");
    expect(input).toHaveClass("focus-visible:outline-offset-0", "focus-visible:outline-2");
    expect(input).not.toHaveClass("focus-visible:outline-offset-2");
  });
});
