import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import {
  Combobox,
  type ComboboxChipRemoveProps,
  type ComboboxClearProps,
  type ComboboxTriggerProps,
} from "./Combobox";

afterEach(cleanup);

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];

describe("Combobox", () => {
  it("renders Control with custom className", () => {
    render(<Combobox.Control className="custom" data-testid="control" />);
    expect(screen.getByTestId("control")).toHaveClass("custom");
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

  it("has no a11y violations", async () => {
    const { container } = render(
      <Combobox.Root>
        <Combobox.Input aria-label="Search" className="custom" data-testid="input" />
      </Combobox.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Combobox icon buttons", () => {
  const fruits = ["Apple", "Banana"];

  // The documented multi-select pattern, with the icon buttons rendered as is
  function MultiSelect({
    triggerProps,
    clearProps,
    chipRemoveProps,
  }: {
    triggerProps?: ComboboxTriggerProps;
    clearProps?: ComboboxClearProps;
    chipRemoveProps?: ComboboxChipRemoveProps;
  }) {
    return (
      <Combobox.Root multiple items={fruits} defaultValue={["Apple"]}>
        <Combobox.Control>
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove {...chipRemoveProps} />
            </Combobox.Chip>
          </Combobox.Chips>
          <Combobox.Input aria-label="Fruits" />
          <Combobox.Clear {...clearProps} />
          <Combobox.Trigger {...triggerProps} />
        </Combobox.Control>
      </Combobox.Root>
    );
  }

  it("names the default Trigger, Clear and ChipRemove", () => {
    render(<MultiSelect />);
    expect(screen.getByRole("button", { name: "Show options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
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
      "render element text",
      ["Choose", "Reset", "Drop"],
      {
        triggerProps: { render: <button type="button">Choose</button> },
        clearProps: { render: <button type="button">Reset</button> },
        chipRemoveProps: { render: <button type="button">Drop</button> },
      },
    ],
    [
      "custom children",
      ["Fruits", "Clear all", "Drop"],
      {
        triggerProps: { children: "Fruits" },
        clearProps: { children: "Clear all" },
        chipRemoveProps: { children: "Drop" },
      },
    ],
  ])("takes the name from %s instead of the default", (_case, names, props) => {
    render(<MultiSelect {...props} />);
    for (const name of names) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });
});
