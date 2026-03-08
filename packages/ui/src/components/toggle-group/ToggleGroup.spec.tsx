import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
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
});
