import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Collapsible } from "./Collapsible";

afterEach(cleanup);

function BasicCollapsible() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Panel data-testid="panel">Hidden content</Collapsible.Panel>
    </Collapsible.Root>
  );
}

describe("Collapsible", () => {
  it("renders trigger", () => {
    render(<BasicCollapsible />);
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  it("toggles panel on click", async () => {
    const user = userEvent.setup();
    render(<BasicCollapsible />);
    const trigger = screen.getByText("Toggle");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("data-panel-open");
    await user.click(trigger);
    expect(trigger).not.toHaveAttribute("data-panel-open");
  });

  it("opens by default when defaultOpen is set", () => {
    render(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(screen.getByText("Toggle")).toHaveAttribute("data-panel-open");
  });

  it("calls onOpenChange when toggled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Collapsible.Root onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>,
    );
    await user.click(screen.getByText("Toggle"));
    expect(onOpenChange).toHaveBeenCalled();
    expect(onOpenChange.mock.calls[0]![0]).toBe(true);
  });

  it("merges custom className on Root", () => {
    render(
      <Collapsible.Root className="custom" data-testid="root">
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Trigger", () => {
    render(
      <Collapsible.Root>
        <Collapsible.Trigger className="custom">Toggle</Collapsible.Trigger>
        <Collapsible.Panel>Content</Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("merges custom className on Panel", () => {
    render(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Panel className="custom" data-testid="panel">
          Content
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(screen.getByTestId("panel")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<BasicCollapsible />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
