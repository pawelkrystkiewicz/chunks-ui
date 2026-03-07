import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Combobox } from "./Combobox";

afterEach(cleanup);

const items = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
];

describe("Combobox", () => {
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

  // Chip and ChipRemove are thin styling wrappers that require
  // multi-select with active selections to render in Base UI context.
  // They are covered by integration/Playwright CT tests.
});
