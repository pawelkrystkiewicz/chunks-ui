import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { ScrollArea } from "./ScrollArea";

afterEach(cleanup);

function DefaultScrollArea() {
  return (
    <ScrollArea.Root data-testid="root">
      <ScrollArea.Viewport data-testid="viewport">
        <ScrollArea.Content data-testid="content">
          <p>Scrollable content</p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" data-testid="scrollbar-vertical">
        <ScrollArea.Thumb data-testid="thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner data-testid="corner" />
    </ScrollArea.Root>
  );
}

describe("ScrollArea", () => {
  it("renders all sub-components", () => {
    render(<DefaultScrollArea />);
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByTestId("viewport")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByTestId("scrollbar-vertical")).toBeInTheDocument();
    expect(screen.getByTestId("scrollbar-horizontal")).toBeInTheDocument();
    expect(screen.getByTestId("thumb")).toBeInTheDocument();
    expect(screen.getByTestId("corner")).toBeInTheDocument();
    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(
      <ScrollArea.Root className="h-64 w-full" data-testid="root">
        <ScrollArea.Viewport>
          <ScrollArea.Content>Content</ScrollArea.Content>
        </ScrollArea.Viewport>
      </ScrollArea.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("h-64");
    expect(screen.getByTestId("root")).toHaveClass("w-full");
  });

  it("merges custom className on Scrollbar", () => {
    render(
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content>Content</ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="custom-scrollbar" data-testid="sb">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>,
    );
    expect(screen.getByTestId("sb")).toHaveClass("custom-scrollbar");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<DefaultScrollArea />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
