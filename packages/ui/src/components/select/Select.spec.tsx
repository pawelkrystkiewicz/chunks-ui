import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureAxe } from "jest-axe";
import { createRef, type ReactElement, useLayoutEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { undecided } from "../../AxeTest.utils";
import { Field } from "../field";
import { FOCUS_RING } from "../shared";
import { Select, type SelectRootProps } from "./Select";

afterEach(cleanup);

// aria-hidden-focus skips Base UI's focus guards, aria-hidden spans that hand focus on when Tab
// reaches them. A browser's axe leaves them for review, as it takes the open select's full-page
// backdrop for a modal. jsdom can't hit-test the backdrop, so axe finds no modal and flags them.
// The rule still checks every other aria-hidden node. Were axe to find a modal, it would leave a
// stray one in `incomplete`, which toHaveNoViolations() does not read, so the open audit also
// checks that the rule left nothing there
const axe = configureAxe({
  globalOptions: {
    rules: [
      { id: "aria-hidden-focus", selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])' },
    ],
  },
});

describe("Select", () => {
  it("renders Trigger with custom className", () => {
    render(
      <Select.Root>
        <Select.Trigger className="custom" data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByTestId("trigger")).toHaveClass("custom");
  });

  it("mutes the Trigger with data-placeholder only while nothing is selected", () => {
    const select = (value: string | null) => (
      <Select.Root value={value}>
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Pick a fruit" />
        </Select.Trigger>
      </Select.Root>
    );
    const { rerender } = render(select(null));
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("data-placeholder", "");
    expect(trigger).toHaveClass("data-placeholder:text-muted-foreground");
    rerender(select("apple"));
    expect(trigger).not.toHaveAttribute("data-placeholder");
  });

  it.each([
    { kind: "string", className: "custom" },
    { kind: "function", className: () => "custom" },
  ])("renders Value with a custom $kind className", ({ className }) => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value className={className} data-testid="value" placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByTestId("value")).toHaveClass(
      "custom",
      "flex-1",
      "text-start",
      "overflow-hidden",
      "text-ellipsis",
      "whitespace-nowrap",
    );
  });

  it("lets a Value className flex-initial replace flex-1", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value className="flex-initial" data-testid="value" placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    const value = screen.getByTestId("value");
    expect(value).toHaveClass("flex-initial");
    expect(value).not.toHaveClass("flex-1");
  });

  it("lets a Value className bring back wrapping and keep the clip", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value className="whitespace-normal" data-testid="value" placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    const value = screen.getByTestId("value");
    expect(value).toHaveClass("overflow-hidden", "text-ellipsis", "whitespace-normal");
    expect(value).not.toHaveClass("whitespace-nowrap");
  });

  it("renders Icon with custom className", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Icon className="custom" data-testid="icon" />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(screen.getByTestId("icon")).toHaveClass("custom");
  });

  // Base UI's Icon renders a `▼` when it has no children; ours draws a chevron svg instead
  it("renders the chevron in Icon when it has no children", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Icon data-testid="icon" />
        </Select.Trigger>
      </Select.Root>,
    );
    const icon = screen.getByTestId("icon");
    expect(icon.querySelector("svg")).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the children of Icon in place of the chevron", () => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Icon data-testid="icon">custom</Select.Icon>
        </Select.Trigger>
      </Select.Root>,
    );
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveTextContent(/^custom$/);
    expect(icon.querySelector("svg")).not.toBeInTheDocument();
  });

  it.each([
    ["no chevron in a render element", <span key="span" data-testid="icon" />],
    [
      "a void render element without an error",
      <img key="img" alt="" src="data:," data-testid="icon" />,
    ],
  ])("renders %s on Icon", (_case, element) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Icon render={element} />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("icon")).toBeEmptyDOMElement();
  });

  it("renders Popup with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup className="custom" data-testid="popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("renders Item with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a" className="custom" data-testid="item">
              A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("item")).toHaveClass("custom");
  });

  it("renders the check in ItemIndicator when it has no children", () => {
    render(
      <Select.Root open defaultValue="a">
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a">
              <Select.ItemIndicator data-testid="ind" />A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("ind").querySelector("svg")).toBeInTheDocument();
  });

  it("renders the children of ItemIndicator in place of the check", () => {
    render(
      <Select.Root open defaultValue="a">
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a">
              <Select.ItemIndicator data-testid="ind">custom</Select.ItemIndicator>A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    const indicator = screen.getByTestId("ind");
    expect(indicator).toHaveTextContent(/^custom$/);
    expect(indicator.querySelector("svg")).not.toBeInTheDocument();
  });

  it.each([
    ["no check in a render element", <span key="span" data-testid="ind" />],
    [
      "a void render element without an error",
      <img key="img" alt="" src="data:," data-testid="ind" />,
    ],
  ])("renders %s on ItemIndicator", (_case, element) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Select.Root open defaultValue="a">
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="a">
              <Select.ItemIndicator render={element} />A
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("ind")).toBeEmptyDOMElement();
  });

  it("renders GroupLabel with custom className", () => {
    render(
      <Select.Root open>
        <Select.Trigger>Pick</Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Group>
              <Select.GroupLabel className="custom" data-testid="gl">
                Fruits
              </Select.GroupLabel>
            </Select.Group>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );
    expect(screen.getByTestId("gl")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Select.Root>
        <Select.Trigger aria-label="Choose">
          <Select.Value placeholder="Pick" />
          <Select.Icon />
        </Select.Trigger>
      </Select.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations with the popup open", async () => {
    const { container } = render(
      <Select.Root open defaultValue="apple">
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose a fruit" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Group>
                <Select.GroupLabel>Fruits</Select.GroupLabel>
                <Select.Item value="apple">
                  <Select.ItemText>Apple</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="banana">
                  <Select.ItemText>Banana</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.Group>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    // The popup is portalled out of the container RTL hands back, so audit the body
    expect(container).not.toContainElement(screen.getByRole("listbox"));
    const results = await axe(document.body, {
      rules: {
        // A portalled listbox sits outside any landmark, on a real page too, and the
        // region rule exempts dialogs, not listboxes
        region: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
    expect(undecided(results, "aria-hidden-focus")).toEqual([]);
  });
});

describe("Select focus ring", () => {
  const trigger = () =>
    render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );

  it("draws the library focus ring on the Trigger", () => {
    trigger();
    expect(screen.getByTestId("trigger")).toHaveClass(FOCUS_RING);
  });
});

// `open` and `defaultOpen` are not a press, and a disabled trigger cannot be pressed: as on
// DatePicker, the disabled state wins over them, whoever set it.
describe("Select disabled", () => {
  const fruits = (props: SelectRootProps) => (
    <Select.Root {...props}>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick a fruit" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="apple">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="banana">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
  const trigger = () => screen.getByRole("combobox", { name: "Fruit" });

  it("never opens for a commit when mounted with its own disabled and defaultOpen", () => {
    const onOpenChangeComplete = vi.fn();
    render(fruits({ disabled: true, defaultOpen: true, onOpenChangeComplete }));
    expect(onOpenChangeComplete).not.toHaveBeenCalled();
  });

  // The commit right after an open: the Select's own `disabled` turns on, so Base UI gets a close
  // before its portal mounted the popup (mui/base-ui#6031). The popup must still go.
  const expectGone = (onOpenChangeComplete: ReturnType<typeof vi.fn>) => {
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(document.querySelector("[data-base-ui-inert]")).toBeNull();
    expect(onOpenChangeComplete).toHaveBeenCalledWith(false);
  };

  it("unmounts a defaultOpen Select that its parent disables in the commit after mount", () => {
    const onOpenChangeComplete = vi.fn();
    const Parent = () => {
      const [disabled, setDisabled] = useState(false);
      useLayoutEffect(() => setDisabled(true), []);
      return fruits({ disabled, defaultOpen: true, onOpenChangeComplete });
    };
    render(<Parent />);
    expectGone(onOpenChangeComplete);
  });

  describe.each<[string, (disabled: boolean, props: SelectRootProps) => ReactElement]>([
    ["its own disabled", (disabled, props) => fruits({ disabled, ...props })],
    [
      "a Field.Root",
      (disabled, props) => <Field.Root disabled={disabled}>{fruits(props)}</Field.Root>,
    ],
    [
      "a native fieldset",
      (disabled, props) => <fieldset disabled={disabled}>{fruits(props)}</fieldset>,
    ],
  ])("disabled by %s", (_cause, select) => {
    it("does not open from defaultOpen, nor when it is enabled again", () => {
      const onOpenChange = vi.fn();
      const props = { defaultOpen: true, onOpenChange };
      const { rerender } = render(select(true, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      rerender(select(false, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("does not open from a controlled open until it is enabled, and closes again when disabled", () => {
      const onOpenChange = vi.fn();
      const props = { open: true, onOpenChange };
      const { rerender } = render(select(true, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      rerender(select(false, props));
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      rerender(select(true, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("closes an open listbox when it is disabled, and does not reopen it when it is enabled again", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const props = { onOpenChange };
      const { rerender } = render(select(false, props));
      await user.click(trigger());
      // Base UI opens on the mousedown's next frame
      expect(await screen.findByRole("listbox")).toBeInTheDocument();
      rerender(select(true, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      rerender(select(false, props));
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      // Only the press that opened it: a close that disabling asks for is not the user's
      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true]);
    });
  });

  // A listbox can outlive the disabling: the Select may not render when only its fieldset changes
  // (same element below, so React skips it, and the listbox stays open). Base UI refuses a pick
  // while its own `disabled` or a Field's is on, but knows nothing of a native fieldset. It is
  // `multiple` because Base UI closes a single Select after any pick, cancelled or not, and keeps a
  // multiple one open: only the gate can close this listbox.
  it("ignores a pick once a native fieldset disables it, and closes the listbox", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const select = fruits({ onValueChange, multiple: true });
    const { rerender } = render(<fieldset>{select}</fieldset>);
    await user.click(trigger());
    const banana = await screen.findByRole("option", { name: "Banana" });
    rerender(<fieldset disabled>{select}</fieldset>);
    expect(trigger()).toBeDisabled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(banana);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Pick a fruit");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("fills a consumer actionsRef, and still closes the listbox when disabled", async () => {
    const user = userEvent.setup();
    const actionsRef: SelectRootProps["actionsRef"] = createRef();
    const { rerender } = render(<fieldset>{fruits({ actionsRef })}</fieldset>);
    await user.click(trigger());
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(actionsRef.current).not.toBeNull();
    rerender(<fieldset disabled>{fruits({ actionsRef })}</fieldset>);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
