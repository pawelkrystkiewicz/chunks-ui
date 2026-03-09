import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Accordion } from "./Accordion";

afterEach(cleanup);

function BasicAccordion() {
  return (
    <Accordion.Root>
      <Accordion.Item value="a">
        <Accordion.Header>
          <Accordion.Trigger>Section A</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Content A</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Header>
          <Accordion.Trigger>Section B</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Content B</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

describe("Accordion", () => {
  it("renders all sub-components", () => {
    render(<BasicAccordion />);
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Section B")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(
      <Accordion.Root className="custom" data-testid="root">
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Item", () => {
    render(
      <Accordion.Root>
        <Accordion.Item value="a" className="custom" data-testid="item">
          <Accordion.Header>
            <Accordion.Trigger>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(screen.getByTestId("item")).toHaveClass("custom");
  });

  it("merges custom className on Trigger", () => {
    render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger className="custom">A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(screen.getByRole("button")).toHaveClass("custom");
  });

  it("merges custom className on Panel", () => {
    render(
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="custom" data-testid="panel">
            Content
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(screen.getByTestId("panel")).toHaveClass("custom");
  });

  it("opens and closes on trigger click", async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    const triggerA = screen.getByText("Section A").closest("button");
    expect(triggerA).not.toHaveAttribute("data-panel-open");
    await user.click(triggerA!);
    expect(triggerA).toHaveAttribute("data-panel-open");
    await user.click(triggerA!);
    expect(triggerA).not.toHaveAttribute("data-panel-open");
  });

  it("calls onValueChange when item is toggled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Accordion.Root onValueChange={onValueChange}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await user.click(screen.getByText("A"));
    expect(onValueChange).toHaveBeenCalled();
  });

  it("allows multiple open items when multiple=true", async () => {
    const user = userEvent.setup();
    render(
      <Accordion.Root multiple>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>A</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content A</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>B</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Content B</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const [triggerA, triggerB] = screen.getAllByRole("button");
    await user.click(triggerA!);
    await user.click(triggerB!);
    expect(triggerA).toHaveAttribute("data-panel-open");
    expect(triggerB).toHaveAttribute("data-panel-open");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<BasicAccordion />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
