import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Popover } from "./Popover";

afterEach(cleanup);

describe("Popover", () => {
  it("renders Content with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content className="custom" data-testid="content">
          Content
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("content")).toHaveClass("custom");
  });

  it("renders Arrow with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow className="custom" data-testid="arrow" />
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("arrow")).toHaveClass("custom");
  });

  it("leaves the arrow's padding to Base UI where there is no layout", async () => {
    // jsdom has no layout: the arrow's computed width is "", which must not become a NaN padding
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow data-testid="arrow" />
        </Popover.Content>
      </Popover.Root>,
    );
    const arrow = screen.getByTestId("arrow");
    await waitFor(() => expect(arrow).toHaveAttribute("data-side"));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("renders Title with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title className="custom" data-testid="title">
            Heading
          </Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("title")).toHaveClass("custom");
  });

  it("renders Description with custom className", () => {
    render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Description className="custom" data-testid="desc">
            Info
          </Popover.Description>
        </Popover.Content>
      </Popover.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Popover.Root open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Title</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    // The popup is portalled out of the container RTL hands back, so audit the body
    expect(container).not.toContainElement(screen.getByRole("dialog"));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
