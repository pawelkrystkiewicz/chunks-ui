import { cleanup, render, screen } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOCUS_RING } from "../shared";
import { Select } from "./Select";

afterEach(cleanup);

// aria-hidden-focus skips Base UI's focus guards, aria-hidden spans that hand focus on when Tab
// reaches them. A browser's axe leaves them for review, as it takes the open select's full-page
// backdrop for a modal. jsdom can't hit-test the backdrop, so axe finds no modal and flags them.
// The rule still checks every other aria-hidden node
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
