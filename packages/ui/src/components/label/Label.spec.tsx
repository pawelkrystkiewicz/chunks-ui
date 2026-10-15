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

  describe("disabled", () => {
    // One state attribute, as Base UI sets on Field.Label, so one `data-disabled:` class restyles it
    it("sets data-disabled and keys the dimmed, not-allowed look on it", () => {
      render(<Label disabled>Email</Label>);
      const label = screen.getByText("Email");
      expect(label).toHaveAttribute("data-disabled", "");
      expect(label).not.toHaveAttribute("disabled");
      expect(label).toHaveClass("data-disabled:cursor-not-allowed", "data-disabled:opacity-50");
    });

    it("has no data-disabled when enabled", () => {
      render(<Label>Email</Label>);
      expect(screen.getByText("Email")).not.toHaveAttribute("data-disabled");
    });

    it("lets one class in className replace the disabled opacity", () => {
      render(
        <Label disabled className="data-disabled:opacity-75">
          Email
        </Label>,
      );
      const label = screen.getByText("Email");
      expect(label).toHaveClass("data-disabled:opacity-75");
      expect(label).not.toHaveClass("data-disabled:opacity-50");
    });

    it("has no a11y violations", async () => {
      const { container } = render(
        <>
          <Label htmlFor="a11y-disabled" disabled>
            Accessible
          </Label>
          <input id="a11y-disabled" disabled />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
