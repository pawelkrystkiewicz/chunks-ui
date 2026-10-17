import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { FOCUS_RING } from "../shared";
import { Select } from "./Select";

afterEach(cleanup);

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

  it.each(["flex-initial"])("lets a Value className %s replace flex-1", (flex) => {
    render(
      <Select.Root>
        <Select.Trigger>
          <Select.Value className={flex} data-testid="value" placeholder="Pick" />
        </Select.Trigger>
      </Select.Root>,
    );
    const value = screen.getByTestId("value");
    expect(value).toHaveClass(flex);
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

  it("renders ItemIndicator with checkmark svg", () => {
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
    expect(screen.getByTestId("ind")).toBeInTheDocument();
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
    expect(
      await axe(document.body, {
        rules: {
          // A portalled listbox sits outside any landmark, on a real page too, and the
          // region rule exempts dialogs, not listboxes
          region: { enabled: false },
        },
      }),
    ).toHaveNoViolations();
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
