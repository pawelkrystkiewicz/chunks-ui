import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Card } from "./Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders all sub-components", () => {
    render(
      <Card.Root data-testid="root">
        <Card.Header data-testid="header">
          <Card.Title>Title</Card.Title>
          <Card.Description>Desc</Card.Description>
        </Card.Header>
        <Card.Content data-testid="content">Body</Card.Content>
        <Card.Footer data-testid="footer">Actions</Card.Footer>
      </Card.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("merges custom className on each sub-component", () => {
    render(
      <Card.Root className="r" data-testid="root">
        <Card.Header className="h" data-testid="header">
          <Card.Title className="t" data-testid="title">
            T
          </Card.Title>
          <Card.Description className="d" data-testid="desc">
            D
          </Card.Description>
        </Card.Header>
        <Card.Content className="c" data-testid="content">
          C
        </Card.Content>
        <Card.Footer className="f" data-testid="footer">
          F
        </Card.Footer>
      </Card.Root>,
    );
    expect(screen.getByTestId("root")).toHaveClass("r");
    expect(screen.getByTestId("header")).toHaveClass("h");
    expect(screen.getByTestId("title")).toHaveClass("t");
    expect(screen.getByTestId("desc")).toHaveClass("d");
    expect(screen.getByTestId("content")).toHaveClass("c");
    expect(screen.getByTestId("footer")).toHaveClass("f");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Card.Root>
        <Card.Header>
          <Card.Title>Title</Card.Title>
        </Card.Header>
        <Card.Content>Content</Card.Content>
      </Card.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
