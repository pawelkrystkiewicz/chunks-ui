import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ToggleGroup } from "./ToggleGroup";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

describe("ToggleGroup", () => {
  it("renders Root and Items", () => {
    render(
      <ToggleGroup.Root data-testid="root">
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<ToggleGroup.Root className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Item", () => {
    render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a" className="custom">
          A
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("supports single selection mode by default", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const btnA = screen.getByText("A");
    const btnB = screen.getByText("B");

    await user.click(btnA);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "false");

    await user.click(btnB);
    expect(btnA).toHaveAttribute("aria-pressed", "false");
    expect(btnB).toHaveAttribute("aria-pressed", "true");
  });

  it("supports multiple selection mode", async () => {
    const user = userEvent.setup();
    render(
      <ToggleGroup.Root multiple>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const btnA = screen.getByText("A");
    const btnB = screen.getByText("B");

    await user.click(btnA);
    await user.click(btnB);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
    expect(btnB).toHaveAttribute("aria-pressed", "true");
  });

  it("disables all items when disabled", () => {
    render(
      <ToggleGroup.Root disabled>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });

  it("calls onValueChange when selection changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup.Root onValueChange={onValueChange}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await user.click(screen.getByText("A"));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("syncs to externally controlled value", () => {
    const { rerender } = render(
      <ToggleGroup.Root value={["a"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    rerender(
      <ToggleGroup.Root value={["b"]}>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(screen.getByText("B")).toHaveAttribute("aria-pressed", "true");
  });

  it("renders CSS indicator after single-select", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    await user.click(screen.getByText("A"));
    expect(container.querySelector("span.absolute.z-0")).toBeInTheDocument();
  });

  it("deregisters Item on unmount", () => {
    const { rerender } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    expect(() => rerender(<ToggleGroup.Root />)).not.toThrow();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <ToggleGroup.Root>
        <ToggleGroup.Item value="a">A</ToggleGroup.Item>
        <ToggleGroup.Item value="b">B</ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("allows controlled mode to reject empty selection", async () => {
    const user = userEvent.setup();

    function ControlledToggleGroup() {
      const [value, setValue] = useState(["a"]);
      return (
        <ToggleGroup.Root
          value={value}
          onValueChange={(newValue) => {
            // Reject empty selection
            if (newValue.length > 0) setValue(newValue);
          }}
        >
          <ToggleGroup.Item value="a">A</ToggleGroup.Item>
          <ToggleGroup.Item value="b">B</ToggleGroup.Item>
        </ToggleGroup.Root>
      );
    }

    render(<ControlledToggleGroup />);
    const btnA = screen.getByText("A");

    expect(btnA).toHaveAttribute("aria-pressed", "true");

    // Click selected item to deselect — should be rejected
    await user.click(btnA);
    expect(btnA).toHaveAttribute("aria-pressed", "true");
  });
});
