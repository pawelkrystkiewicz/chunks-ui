import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Label } from "./Label";

afterEach(cleanup);

describe("Label", () => {
  it("renders a label element", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email").tagName).toBe("LABEL");
  });

  it("associates with input via htmlFor", () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
  });

  it("merges custom className", () => {
    render(
      <Label className="custom" data-testid="label">
        Name
      </Label>,
    );
    expect(screen.getByTestId("label")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <>
        <Label htmlFor="a11y-input">Accessible</Label>
        <input id="a11y-input" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
