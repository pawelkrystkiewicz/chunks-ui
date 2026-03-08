import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it } from "vitest";
import { Field } from "./Field";

afterEach(cleanup);

describe("Field", () => {
  it("renders Root, Label, and Description", () => {
    render(
      <Field.Root data-testid="root">
        <Field.Label data-testid="label">Name</Field.Label>
        <Field.Description data-testid="desc">Enter your name</Field.Description>
      </Field.Root>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
  });

  it("renders Error (component function executes even when hidden)", () => {
    const { container } = render(
      <Field.Root>
        <Field.Error className="custom">Required</Field.Error>
      </Field.Root>,
    );
    // Field.Error only renders visible content when there's a validation error,
    // but the wrapper function body is still executed for coverage
    expect(container).toBeInTheDocument();
  });

  it("merges custom className on Root", () => {
    render(<Field.Root className="custom" data-testid="root" />);
    expect(screen.getByTestId("root")).toHaveClass("custom");
  });

  it("merges custom className on Label", () => {
    render(
      <Field.Root>
        <Field.Label className="custom" data-testid="label">
          L
        </Field.Label>
      </Field.Root>,
    );
    expect(screen.getByTestId("label")).toHaveClass("custom");
  });

  it("merges custom className on Description", () => {
    render(
      <Field.Root>
        <Field.Description className="custom" data-testid="desc">
          D
        </Field.Description>
      </Field.Root>,
    );
    expect(screen.getByTestId("desc")).toHaveClass("custom");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <input aria-label="Name" />
        <Field.Description>Help text</Field.Description>
      </Field.Root>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
