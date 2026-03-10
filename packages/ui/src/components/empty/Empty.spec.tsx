import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Empty } from "./Empty";

afterEach(cleanup);

describe("Empty", () => {
  it("renders all compound parts", () => {
    render(
      <Empty.Root>
        <Empty.Media data-testid="media">
          <span>Icon</span>
        </Empty.Media>
        <Empty.Title>No results</Empty.Title>
        <Empty.Description>Try a different search.</Empty.Description>
        <Empty.Actions>
          <button type="button">Clear</button>
        </Empty.Actions>
      </Empty.Root>,
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try a different search.")).toBeInTheDocument();
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("renders Title as h3", () => {
    render(
      <Empty.Root>
        <Empty.Title>Heading</Empty.Title>
      </Empty.Root>,
    );
    expect(screen.getByText("Heading").tagName).toBe("H3");
  });

  it("renders Description as p", () => {
    render(
      <Empty.Root>
        <Empty.Description>Some text</Empty.Description>
      </Empty.Root>,
    );
    expect(screen.getByText("Some text").tagName).toBe("P");
  });

  it("merges custom className on Root", () => {
    render(
      <Empty.Root className="custom" data-testid="root">
        <Empty.Title>Test</Empty.Title>
      </Empty.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Media", () => {
    render(
      <Empty.Root>
        <Empty.Media className="custom" data-testid="media">
          <span>Icon</span>
        </Empty.Media>
      </Empty.Root>,
    );
    expect(screen.getByTestId("media")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Empty.Root>
        <Empty.Title>No items</Empty.Title>
        <Empty.Description>Nothing to show.</Empty.Description>
      </Empty.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
