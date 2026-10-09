import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Menu } from "./Menu";

afterEach(cleanup);

describe("Menu", () => {
  it("renders Trigger and Content when open", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open Menu</Menu.Trigger>
        <Menu.Content data-testid="content">
          <Menu.Item>Item 1</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByText("Open Menu")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("merges className on Content", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content className="custom-content" data-testid="content">
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("content")).toHaveClass("custom-content");
  });

  it("merges className on Item", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item className="custom-item" data-testid="item">
            Item
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("item")).toHaveClass("custom-item");
  });

  it("merges className on Separator", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Item 1</Menu.Item>
          <Menu.Separator className="custom-sep" data-testid="sep" />
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("sep")).toHaveClass("custom-sep");
  });

  it("merges className on GroupLabel", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Group>
            <Menu.GroupLabel className="custom-label" data-testid="label">
              Group
            </Menu.GroupLabel>
            <Menu.Item>Item</Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("label")).toHaveClass("custom-label");
  });

  it("merges className on Arrow", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Arrow className="custom-arrow" data-testid="arrow" />
          <Menu.Item>Item</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom-arrow");
  });

  it("calls onClick when Item is clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.Item onClick={handleClick} data-testid="item">
            Click me
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    await user.click(screen.getByTestId("item"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders RadioGroup with RadioItems", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.RadioGroup value="a">
            <Menu.RadioItem value="a" data-testid="radio-a">
              Option A
            </Menu.RadioItem>
            <Menu.RadioItem value="b" data-testid="radio-b">
              Option B
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("radio-a")).toBeInTheDocument();
    expect(screen.getByTestId("radio-b")).toBeInTheDocument();
  });

  it("merges className on RadioItem", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.RadioGroup value="a">
            <Menu.RadioItem value="a" className="custom-radio" data-testid="radio">
              Option A
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("radio")).toHaveClass("custom-radio");
  });

  it("renders CheckboxItem", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem defaultChecked data-testid="checkbox">
            Toggle me
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("checkbox")).toBeInTheDocument();
  });

  it("merges className on CheckboxItem", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem className="custom-checkbox" data-testid="checkbox">
            Toggle me
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("checkbox")).toHaveClass("custom-checkbox");
  });

  it("renders RadioItemIndicator inside RadioItem", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.RadioGroup value="a">
            <Menu.RadioItem value="a">
              <Menu.RadioItemIndicator data-testid="indicator">✓</Menu.RadioItemIndicator>
              Option A
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("indicator")).toBeInTheDocument();
  });

  it("renders CheckboxItemIndicator inside CheckboxItem", () => {
    render(
      <Menu.Root open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Content>
          <Menu.CheckboxItem checked>
            <Menu.CheckboxItemIndicator data-testid="cb-indicator">✓</Menu.CheckboxItemIndicator>
            Option
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(screen.getByTestId("cb-indicator")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Menu.Root open>
        <Menu.Trigger>Open Menu</Menu.Trigger>
        <Menu.Content>
          <Menu.Item>Item 1</Menu.Item>
          <Menu.Separator />
          <Menu.Item>Item 2</Menu.Item>
        </Menu.Content>
      </Menu.Root>,
    );
    expect(
      await axe(container, {
        rules: {
          // Base UI focus-guard spans with role="button" are internal implementation details
          "aria-command-name": { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});
