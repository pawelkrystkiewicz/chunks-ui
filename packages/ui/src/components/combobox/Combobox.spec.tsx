import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { type ComponentProps, createRef } from "react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { FOCUS_RING, FOCUS_RING_WITHIN } from "../shared";
import {
  Combobox,
  type ComboboxChipRemoveProps,
  type ComboboxClearProps,
  type ComboboxRootProps,
  type ComboboxTriggerProps,
} from "./Combobox";
import { type ComboboxLabels, DEFAULT_COMBOBOX_LABELS } from "./Combobox.Labels";

afterEach(cleanup);

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];

describe("Combobox", () => {
  it("renders Control with custom className", () => {
    render(
      <Combobox.Root>
        <Combobox.Control className="custom" data-testid="control" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("control")).toHaveClass("custom");
  });

  // Base UI's InputGroup: the part the popup anchors to, so the popup lines up with the Control
  it("renders Control as Base UI's InputGroup, a group with the popup state", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Combobox.Root open disabled>
        <Combobox.Control
          ref={ref}
          data-testid="control"
          className={(state) => (state.disabled ? "is-disabled" : "is-enabled")}
        >
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Control>
      </Combobox.Root>,
    );
    const control = screen.getByTestId("control");
    expect(ref.current).toBe(control);
    expect(control).toHaveAttribute("role", "group");
    expect(control).toHaveAttribute("data-popup-open");
    expect(control).toHaveClass("is-disabled", FOCUS_RING_WITHIN);
  });

  // Base UI's handler on the InputGroup: a press on the padding focuses the input, opens the popup
  it("focuses the input and opens the popup on a press on the Control's padding", () => {
    render(
      <Combobox.Root items={items}>
        <Combobox.Control data-testid="control">
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Control>
      </Combobox.Root>,
    );
    const control = screen.getByTestId("control");
    expect(control).not.toHaveAttribute("data-popup-open");
    fireEvent.mouseDown(control);
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(control).toHaveAttribute("data-popup-open");
  });

  it("focuses the input but leaves the popup closed on a press on the Control when openOnInputClick is false", () => {
    render(
      <Combobox.Root items={items} openOnInputClick={false}>
        <Combobox.Control data-testid="control">
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Control>
      </Combobox.Root>,
    );
    const control = screen.getByTestId("control");
    fireEvent.mouseDown(control);
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(control).not.toHaveAttribute("data-popup-open");
  });

  it("does not open the popup on a press on Clear or ChipRemove", () => {
    render(
      <Combobox.Root multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Control data-testid="control">
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove />
            </Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
          <Combobox.Clear />
        </Combobox.Control>
      </Combobox.Root>,
    );
    const control = screen.getByTestId("control");
    fireEvent.mouseDown(screen.getByRole("button", { name: DEFAULT_COMBOBOX_LABELS.clear }));
    fireEvent.mouseDown(screen.getByRole("button", { name: /Remove/ }));
    expect(control).not.toHaveAttribute("data-popup-open");
  });

  it("renders Chips with the default gap, merged with a custom className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Combobox.Root multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Control>
          <Combobox.Chips ref={ref} className="custom gap-2" data-testid="chips">
            <Combobox.Chip>Apple</Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
        </Combobox.Control>
      </Combobox.Root>,
    );
    const chips = screen.getByTestId("chips");
    expect(ref.current).toBe(chips);
    expect(chips).toHaveClass("custom", "flex", "flex-wrap", "items-center", "gap-2");
    expect(chips).not.toHaveClass("gap-1");
  });

  // Chips fills the Control's free width, so the input after the chips can take the rest of the
  // row (#686)
  it("renders Chips with flex-1, which a flex class in className replaces", () => {
    const chips = (className?: string) => (
      <Combobox.Root multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Control>
          <Combobox.Chips className={className} data-testid="chips">
            <Combobox.Chip>Apple</Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
        </Combobox.Control>
      </Combobox.Root>
    );
    const { rerender } = render(chips());
    expect(screen.getByTestId("chips")).toHaveClass("flex-1");
    rerender(chips("flex-initial"));
    expect(screen.getByTestId("chips")).toHaveClass("flex-initial");
    expect(screen.getByTestId("chips")).not.toHaveClass("flex-1");
  });

  it("renders Input with custom className", () => {
    render(
      <Combobox.Root>
        <Combobox.Input className="custom" data-testid="input" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("input")).toHaveClass("custom");
  });

  it("renders Trigger with default chevron icon", () => {
    render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger" />
      </Combobox.Root>,
    );
    const trigger = screen.getByTestId("trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Trigger with custom children", () => {
    render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger">
          <span data-testid="custom-icon">V</span>
        </Combobox.Trigger>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders Trigger with custom className", () => {
    render(
      <Combobox.Root>
        <Combobox.Trigger className="custom" data-testid="trigger" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("trigger")).toHaveClass("custom");
  });

  it("renders Icon with default chevron", () => {
    render(
      <Combobox.Root>
        <Combobox.Icon data-testid="icon" />
      </Combobox.Root>,
    );
    const icon = screen.getByTestId("icon");
    expect(icon).toBeInTheDocument();
    expect(icon.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Icon with custom children", () => {
    render(
      <Combobox.Root>
        <Combobox.Icon data-testid="icon">
          <span data-testid="custom">^</span>
        </Combobox.Icon>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("renders no chevron in a void render element on Icon, without an error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Combobox.Root>
        <Combobox.Icon render={<img alt="" src="data:," data-testid="icon" />} />
      </Combobox.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("icon").tagName).toBe("IMG");
    expect(screen.getByTestId("icon")).toBeEmptyDOMElement();
  });

  it("renders Icon with custom className", () => {
    render(
      <Combobox.Root>
        <Combobox.Icon className="custom" data-testid="icon" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("icon")).toHaveClass("custom");
  });

  it("renders Popup with custom className", () => {
    render(
      <Combobox.Root open items={items}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup className="custom" data-testid="popup">
              <Combobox.List>
                {(item) => <Combobox.Item key={item.value} value={item.value} />}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("popup")).toHaveClass("custom");
  });

  it("renders Item with custom className", () => {
    render(
      <Combobox.Root open items={items}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item
                    key={item.value}
                    value={item.value}
                    className="custom"
                    data-testid={`item-${item.value}`}
                  >
                    {item.label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("item-apple")).toHaveClass("custom");
  });

  it("renders ItemIndicator inside Item", () => {
    render(
      <Combobox.Root open items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={item.value} value={item.value}>
                    <Combobox.ItemIndicator data-testid={`ind-${item.value}`} />
                    {item.label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("ind-apple")).toBeInTheDocument();
  });

  it("renders ItemIndicator with custom children", () => {
    render(
      <Combobox.Root open items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={item.value} value={item.value}>
                    <Combobox.ItemIndicator>
                      <span data-testid={`check-${item.value}`}>OK</span>
                    </Combobox.ItemIndicator>
                    {item.label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("check-apple")).toBeInTheDocument();
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
      <Combobox.Root open items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => (
                  <Combobox.Item key={item.value} value={item.value}>
                    <Combobox.ItemIndicator render={element} />
                    {item.label}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("ind")).toBeEmptyDOMElement();
  });

  it("renders Empty with custom className", () => {
    render(
      <Combobox.Root open items={[]}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty className="custom" data-testid="empty">
                No results
              </Combobox.Empty>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("empty")).toHaveClass("custom");
  });

  it("renders Clear with default icon", () => {
    render(
      <Combobox.Root items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Clear data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => <Combobox.Item key={item.value} value={item.value} />}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    const clear = screen.getByTestId("clear");
    expect(clear).toBeInTheDocument();
    expect(clear.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Clear with custom children", () => {
    render(
      <Combobox.Root items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Clear data-testid="clear">
          <span data-testid="custom-x">X</span>
        </Combobox.Clear>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => <Combobox.Item key={item.value} value={item.value} />}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("custom-x")).toBeInTheDocument();
  });

  it("renders Clear with custom className", () => {
    render(
      <Combobox.Root items={items} defaultValue="apple">
        <Combobox.Input />
        <Combobox.Clear className="custom" data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                {(item) => <Combobox.Item key={item.value} value={item.value} />}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("clear")).toHaveClass("custom");
  });

  it("renders GroupLabel with custom className", () => {
    render(
      <Combobox.Root open items={items}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Group>
                <Combobox.GroupLabel className="custom" data-testid="gl">
                  Category
                </Combobox.GroupLabel>
                <Combobox.List>
                  {(item) => <Combobox.Item key={item.value} value={item.value} />}
                </Combobox.List>
              </Combobox.Group>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("gl")).toHaveClass("custom");
  });

  // Checked by check-types: the generic defaults keep Root's props those of Base UI, plus labels
  it("types Root's props as Base UI's Root props plus labels", () => {
    expectTypeOf<ComboboxRootProps>().toEqualTypeOf<
      ComponentProps<typeof BaseCombobox.Root> & { labels?: Partial<ComboboxLabels> }
    >();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Combobox.Root>
        <Combobox.Input aria-label="Search" className="custom" data-testid="input" />
      </Combobox.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // The popup of the documented single and multi-select patterns
  function Popup() {
    return (
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: (typeof items)[number]) => (
                <Combobox.Item key={item.value} value={item}>
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
            </Combobox.List>
            <Combobox.Empty>No results found.</Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    );
  }

  // A portalled listbox sits outside any landmark, on a real page too, and the region rule
  // exempts dialogs, not listboxes
  const auditBody = () => axe(document.body, { rules: { region: { enabled: false } } });

  it("has no a11y violations with the popup open", async () => {
    const { container } = render(
      <Combobox.Root open items={items} defaultValue={items[0]}>
        <Combobox.Control>
          <Combobox.Input aria-label="Fruit" />
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.Control>
        <Popup />
      </Combobox.Root>,
    );
    // The popup is portalled out of the container RTL hands back, so audit the body
    expect(container).not.toContainElement(screen.getByRole("listbox"));
    expect(await auditBody()).toHaveNoViolations();
  });

  it("has no a11y violations with the popup open in multi-select", async () => {
    const { container } = render(
      <Combobox.Root open multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Control>
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove />
            </Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.Control>
        <Popup />
      </Combobox.Root>,
    );
    // The popup is portalled out of the container RTL hands back, so audit the body. While it is
    // open, Base UI hides the chips, Clear and Trigger from assistive tech, so this audit covers the
    // input, the Chips toolbar and the listbox; "passes axe with every icon button named" covers
    // the chips.
    expect(container).not.toContainElement(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    expect(await auditBody()).toHaveNoViolations();
  });

  it("has no a11y violations with the popup open and nothing matching", async () => {
    const { container } = render(
      <Combobox.Root open items={items} defaultInputValue="zzz">
        <Combobox.Control>
          <Combobox.Input aria-label="Fruit" />
        </Combobox.Control>
        <Popup />
      </Combobox.Root>,
    );
    expect(container).not.toContainElement(await screen.findByText("No results found."));
    expect(await auditBody()).toHaveNoViolations();
  });
});

// Trigger-style: the Trigger shows the value and the search input is in the popup. Base UI's
// Combobox.Value renders no element, so ours puts it in a span that clips to one line (#541).
describe("Combobox.Value", () => {
  const triggerStyle = (
    valueProps: ComponentProps<typeof Combobox.Value> = {},
    selected: (typeof items)[number] | null | undefined = items[0],
  ) =>
    render(
      <Combobox.Root items={items} defaultValue={selected}>
        <Combobox.Trigger aria-label="Fruit">
          <Combobox.Value data-testid="value" {...valueProps} />
          <Combobox.Icon />
        </Combobox.Trigger>
      </Combobox.Root>,
    );

  it("renders the selected label in a span that stays on one line and ends in an ellipsis", async () => {
    const { container } = triggerStyle();
    const value = screen.getByTestId("value");
    expect(value.tagName).toBe("SPAN");
    expect(value).toHaveTextContent(/^Apple$/);
    expect(value).toHaveClass("overflow-hidden", "text-ellipsis", "whitespace-nowrap");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the placeholder in the span while nothing is selected", () => {
    triggerStyle({ placeholder: "Pick a fruit" }, null);
    const value = screen.getByTestId("value");
    expect(value).toHaveTextContent(/^Pick a fruit$/);
  });

  it("mutes the Value, not the Trigger, while nothing is selected", () => {
    triggerStyle({ placeholder: "Pick a fruit" }, null);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("data-placeholder");
    expect(trigger).not.toHaveClass("data-placeholder:text-muted-foreground");
    expect(screen.getByTestId("value")).toHaveClass("in-data-placeholder:text-muted-foreground");
  });

  it("lets in-data-placeholder:text-inherit in a Value className replace the muted colour", () => {
    triggerStyle({ className: "in-data-placeholder:text-inherit" }, null);
    const value = screen.getByTestId("value");
    expect(value).toHaveClass("in-data-placeholder:text-inherit", "flex-1", "overflow-hidden");
    expect(value).not.toHaveClass("in-data-placeholder:text-muted-foreground");
  });

  it("renders Value with a custom className", () => {
    triggerStyle({ className: "custom" });
    expect(screen.getByTestId("value")).toHaveClass(
      "custom",
      "flex-1",
      "text-start",
      "overflow-hidden",
      "text-ellipsis",
      "whitespace-nowrap",
    );
  });

  it("lets a Value className replace flex-1 and whitespace-nowrap, and keep the clip", () => {
    triggerStyle({ className: "flex-initial whitespace-normal" });
    const value = screen.getByTestId("value");
    expect(value).toHaveClass(
      "flex-initial",
      "overflow-hidden",
      "text-ellipsis",
      "whitespace-normal",
    );
    expect(value).not.toHaveClass("flex-1");
    expect(value).not.toHaveClass("whitespace-nowrap");
  });

  it("forwards a ref and other span props to the span", () => {
    const ref = createRef<HTMLSpanElement>();
    triggerStyle({ ref, title: "The fruit" });
    const value = screen.getByTestId("value");
    expect(ref.current).toBe(value);
    expect(value).toHaveAttribute("title", "The fruit");
  });

  // Base UI's function child formats the selected value: in a single-select the trigger shows what
  // it returns like any other value, so it needs the clip too
  it("renders the result of a function child in a single-select in the span", () => {
    triggerStyle({ children: (selected: (typeof items)[number]) => selected.label.toUpperCase() });
    const value = screen.getByTestId("value");
    expect(value.tagName).toBe("SPAN");
    expect(value).toHaveTextContent(/^APPLE$/);
  });

  // Only a function child in a multi-select goes without the span: this one is the labels as text,
  // "Apple, Banana", which the trigger clips like a single value
  it("renders the labels of a multi-select in the span", () => {
    render(
      <Combobox.Root multiple items={items} defaultValue={items}>
        <Combobox.Trigger aria-label="Fruits">
          <Combobox.Value data-testid="value" />
          <Combobox.Icon />
        </Combobox.Trigger>
      </Combobox.Root>,
    );
    const value = screen.getByTestId("value");
    expect(value.tagName).toBe("SPAN");
    expect(value).toHaveTextContent(/^Apple, Banana$/);
  });

  // Base UI's multi-select returns the chips and the input from a function child; they must stay
  // children of Combobox.Chips, which lays them out in a row
  it("renders no element around a function child in a multi-select", () => {
    render(
      <Combobox.Root multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Chips data-testid="chips">
          <Combobox.Value>
            {(selected: typeof items) =>
              selected.map((item) => (
                <Combobox.Chip key={item.value} data-testid="chip">
                  {item.label}
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("chip").parentElement).toBe(screen.getByTestId("chips"));
  });
});

describe("Combobox icon buttons", () => {
  const fruits = ["Apple", "Banana"];

  // The documented multi-select pattern, with the icon buttons rendered as is
  function MultiSelect({
    triggerProps,
    clearProps,
    chipRemoveProps,
    labels,
  }: {
    triggerProps?: ComboboxTriggerProps;
    clearProps?: ComboboxClearProps;
    chipRemoveProps?: ComboboxChipRemoveProps;
    labels?: Partial<ComboboxLabels>;
  }) {
    return (
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]} labels={labels}>
        <Combobox.Control>
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove {...chipRemoveProps} />
            </Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
          <Combobox.Clear {...clearProps} />
          <Combobox.Trigger {...triggerProps} />
        </Combobox.Control>
      </Combobox.Root>
    );
  }

  it("types DEFAULT_COMBOBOX_LABELS as read-only", () => {
    expectTypeOf(DEFAULT_COMBOBOX_LABELS).toEqualTypeOf<Readonly<ComboboxLabels>>();
  });

  it("names the default Trigger, Clear and ChipRemove", () => {
    render(<MultiSelect />);
    expect(screen.getByRole("button", { name: "Show options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBeInTheDocument();
  });

  it("names them with DEFAULT_COMBOBOX_LABELS", () => {
    render(<MultiSelect />);
    const { trigger, clear, chipRemove } = DEFAULT_COMBOBOX_LABELS;
    for (const name of [trigger, clear, `${chipRemove} Apple`]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("takes the names from labels on Root", () => {
    render(
      <MultiSelect
        labels={{ trigger: "Pokaż opcje", clear: "Wyczyść wybór", chipRemove: "Usuń" }}
      />,
    );
    for (const name of ["Pokaż opcje", "Wyczyść wybór", "Usuń Apple"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it.each([
    { chipRemove: "{chip} を削除", name: "Apple を削除" },
    { chipRemove: "Supprimer {chip} ?", name: "Supprimer Apple ?" },
  ])("puts the chip's content where $chipRemove has {chip}", ({ chipRemove, name }) => {
    render(<MultiSelect labels={{ chipRemove }} />);
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  // Base UI's own Chip gives ChipRemove no chip to be named after
  it("drops {chip} from the name of a ChipRemove outside Combobox.Chip", () => {
    render(
      <Combobox.Root
        multiple
        items={fruits}
        defaultValue={["Apple"]}
        labels={{ chipRemove: "Supprimer {chip} ?" }}
      >
        <Combobox.Chips>
          <BaseCombobox.Chip>
            Apple
            <Combobox.ChipRemove />
          </BaseCombobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByRole("button", { name: "Supprimer ?" })).toBeInTheDocument();
  });

  // On purpose: the name keeps the button's own text, so it contains the visible text (WCAG
  // 2.5.3 Label in Name). Pointing aria-labelledby at the chip's label only would drop it (#601).
  it("reads text children of a ChipRemove with the chip's text", () => {
    render(
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]}>
        <Combobox.Chips>
          <Combobox.Chip>
            Apple
            <Combobox.ChipRemove>Drop</Combobox.ChipRemove>
          </Combobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByRole("button", { name: "Remove Apple Drop" })).toBeInTheDocument();
  });

  it("names ChipRemove after rich chip content", () => {
    render(
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]}>
        <Combobox.Chips>
          <Combobox.Chip>
            <svg aria-hidden="true" />
            <span>Apple</span> pie
            <Combobox.ChipRemove />
          </Combobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByRole("button", { name: "Remove Apple pie" })).toBeInTheDocument();
  });

  it("names ChipRemove after a chip with its own id", () => {
    render(
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]}>
        <Combobox.Chips>
          <Combobox.Chip id="apple-chip">
            Apple
            <Combobox.ChipRemove />
          </Combobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBeInTheDocument();
  });

  it("prefers aria-label on a part over labels", () => {
    render(
      <MultiSelect
        labels={{ trigger: "Pokaż opcje", clear: "Wyczyść wybór", chipRemove: "Usuń" }}
        triggerProps={{ "aria-label": "Show fruits" }}
        clearProps={{ "aria-label": "Clear fruits" }}
        chipRemoveProps={{ "aria-label": "Drop Apple" }}
      />,
    );
    for (const name of ["Show fruits", "Clear fruits", "Drop Apple"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("passes axe with every icon button named", async () => {
    const { container } = render(<MultiSelect />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    [
      "aria-label",
      ["Show fruits", "Clear fruits", "Remove Apple"],
      {
        triggerProps: { "aria-label": "Show fruits" },
        clearProps: { "aria-label": "Clear fruits" },
        chipRemoveProps: { "aria-label": "Remove Apple" },
      },
    ],
    [
      "aria-label next to text children",
      ["Show fruits", "Clear all fruits", "Drop Apple"],
      {
        triggerProps: { "aria-label": "Show fruits", children: "Fruits" },
        clearProps: { "aria-label": "Clear all fruits", children: "Clear all" },
        chipRemoveProps: { "aria-label": "Drop Apple", children: "Drop" },
      },
    ],
  ])("takes the name from %s instead of the default", (_case, names, props) => {
    render(<MultiSelect {...props} />);
    for (const name of names) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  // Beside an input, the Trigger's content names it. With the input inside the popup, the Trigger
  // is a `combobox`, which its content does not name: it needs an aria-label or a Field.Label (#620)
  it.each([
    ["render element text", { render: <button type="button">Choose</button> }, "Choose"],
    ["custom children", { children: "Fruits" }, "Fruits"],
  ])("names the Trigger by its %s instead of the default", (_case, triggerProps, name) => {
    render(<MultiSelect triggerProps={triggerProps} />);
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show options" })).not.toBeInTheDocument();
  });

  // Clear and ChipRemove are icon buttons: they keep the default name whatever their content
  it("keeps the default names of Clear and ChipRemove with icon or text children in place of the X", () => {
    const { unmount } = render(
      <MultiSelect
        clearProps={{ children: <svg aria-hidden="true" data-testid="clear-icon" /> }}
        chipRemoveProps={{ children: <svg aria-hidden="true" data-testid="remove-icon" /> }}
      />,
    );
    const clear = screen.getByRole("button", { name: "Clear selection" });
    const remove = screen.getByRole("button", { name: "Remove Apple" });
    expect(clear.querySelectorAll("svg")).toHaveLength(1);
    expect(clear.querySelector("svg")).toBe(screen.getByTestId("clear-icon"));
    expect(remove.querySelectorAll("svg")).toHaveLength(1);
    expect(remove.querySelector("svg")).toBe(screen.getByTestId("remove-icon"));
    unmount();

    render(<MultiSelect clearProps={{ children: "Clear all" }} />);
    expect(screen.getByRole("button", { name: "Clear selection" })).toHaveTextContent(
      /^Clear all$/,
    );
  });

  it("keeps the default name of a ChipRemove outside Combobox.Chip with text children", () => {
    render(
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]}>
        <Combobox.Chips>
          <BaseCombobox.Chip>
            Apple
            <Combobox.ChipRemove>Drop</Combobox.ChipRemove>
          </BaseCombobox.Chip>
        </Combobox.Chips>
      </Combobox.Root>,
    );
    expect(screen.getByRole("button", { name: "Remove" })).toHaveTextContent(/^Drop$/);
  });

  it("keeps the default names of Clear and ChipRemove in render elements, which get no X", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const img = (testId: string) => ({
      nativeButton: false,
      render: <img alt="" src="data:," data-testid={testId} />,
    });
    const { unmount } = render(
      <MultiSelect
        triggerProps={{ ...img("trigger"), "aria-label": "Show fruits" }}
        clearProps={img("clear")}
        chipRemoveProps={img("remove")}
      />,
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    expect(screen.getByTestId("trigger").tagName).toBe("IMG");
    expect(screen.getByRole("button", { name: "Clear selection" })).toBe(
      screen.getByTestId("clear"),
    );
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBe(screen.getByTestId("remove"));
    unmount();

    render(
      <MultiSelect
        clearProps={{ render: <button type="button" data-testid="clear" /> }}
        chipRemoveProps={{ render: <button type="button" data-testid="remove" /> }}
      />,
    );
    expect(screen.getByRole("button", { name: "Clear selection" })).toBe(
      screen.getByTestId("clear"),
    );
    expect(screen.getByRole("button", { name: "Remove Apple" })).toBe(screen.getByTestId("remove"));
    expect(screen.getByTestId("clear")).toBeEmptyDOMElement();
    expect(screen.getByTestId("remove")).toBeEmptyDOMElement();
  });
});

describe("Combobox focus ring", () => {
  it("draws the library focus ring on Input", () => {
    render(
      <Combobox.Root>
        <Combobox.Input aria-label="Search" data-testid="input" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("input")).toHaveClass(FOCUS_RING);
  });

  // The wrapper draws the ring while the input inside it has the focus
  it("draws the focus-within ring classes on Control", () => {
    render(
      <Combobox.Root>
        <Combobox.Control data-testid="control" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId("control")).toHaveClass(FOCUS_RING_WITHIN);
  });

  // The arrow keys move the focus from the input to a chip
  it("draws the library focus ring on Chip", () => {
    render(
      <Combobox.Root multiple items={items} defaultValue={[items[0]]}>
        <Combobox.Control>
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">Apple</Combobox.Chip>
            <Combobox.Input aria-label="Fruits" />
          </Combobox.Chips>
        </Combobox.Control>
      </Combobox.Root>,
    );
    expect(screen.getByTestId("chip")).toHaveClass(FOCUS_RING);
  });
});
