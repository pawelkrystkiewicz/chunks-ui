import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Field } from "../field";
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

  it("forwards ref and textarea attributes to the textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} rows={5} aria-label="Notes" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute("rows", "5");
  });

  it("calls onChange as the user types", async () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="Notes" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "Hi");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("textbox")).toHaveValue("Hi");
  });

  it("is disabled by its own disabled prop", () => {
    render(<Textarea aria-label="Notes" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Textarea placeholder="Enter text" aria-label="Message" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Textarea inside Field", () => {
  it("is named by Field.Label and described by Field.Description", async () => {
    const { container } = render(
      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <Field.Description>Write a short bio</Field.Description>
        <Textarea />
      </Field.Root>,
    );
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea).toHaveAccessibleDescription("Write a short bio");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("is disabled by a disabled Field.Root", () => {
    render(
      <Field.Root disabled>
        <Field.Label>Bio</Field.Label>
        <Textarea />
      </Field.Root>,
    );
    expect(screen.getByRole("textbox", { name: "Bio" })).toBeDisabled();
  });

  it("is marked invalid by an invalid Field.Root", async () => {
    const { container } = render(
      <Field.Root invalid>
        <Field.Label>Bio</Field.Label>
        <Textarea />
      </Field.Root>,
    );
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAttribute("data-invalid");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes the field state to a className function", () => {
    render(
      <Field.Root disabled>
        <Field.Label>Bio</Field.Label>
        <Textarea className={(state) => (state.disabled ? "is-disabled" : "is-enabled")} />
      </Field.Root>,
    );
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveClass("is-disabled");
  });
});
