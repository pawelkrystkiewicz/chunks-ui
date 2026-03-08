import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

afterEach(cleanup);

describe("Textarea", () => {
  it("renders a textarea", () => {
    render(<Textarea placeholder="Write..." />);
    expect(screen.getByPlaceholderText("Write...")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Textarea className="custom" data-testid="ta" />);
    expect(screen.getByTestId("ta")).toHaveClass("custom");
  });

  it("applies field-sizing-content when autoResize is true", () => {
    render(<Textarea autoResize data-testid="ta" />);
    expect(screen.getByTestId("ta")).toHaveClass("field-sizing-content");
  });

  it("does not apply field-sizing-content when autoResize is false", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta")).not.toHaveClass("field-sizing-content");
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Textarea placeholder="Enter text" aria-label="Message" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
