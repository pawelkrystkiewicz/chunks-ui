import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("renders Root as a checkbox", () => {
    render(<Checkbox.Root />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Checkbox.Root className="custom" />);
    expect(screen.getByRole("checkbox")).toHaveClass("custom");
  });

  it("renders Indicator inside Root", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toBeInTheDocument();
  });

  it("renders Indicator with custom className", () => {
    render(
      <Checkbox.Root defaultChecked>
        <Checkbox.Indicator data-testid="ind" className="custom" />
      </Checkbox.Root>,
    );
    expect(screen.getByTestId("ind")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
