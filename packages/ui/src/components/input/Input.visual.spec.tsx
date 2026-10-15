import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNotAllowed, focusVisible, renderFixture } from "../../VisualTest.utils";
import { Field } from "../field";
import { Input } from "./index";

const searchIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <title>search</title>
    <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

describe("Input", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(<Input placeholder="Enter text..." />);
    await expect(fixture).toMatchScreenshot();
  });

  it("with value", async () => {
    const { fixture } = await renderFixture(<Input defaultValue="Hello world" />);
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(<Input placeholder="Disabled" disabled />);
    await expect(fixture).toMatchScreenshot();
  });

  it("invalid", async () => {
    const { fixture } = await renderFixture(<Input placeholder="Invalid" data-invalid />);
    await expect(fixture).toMatchScreenshot();
  });

  it("with adornments", async () => {
    const { fixture } = await renderFixture(
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}>
        <Input placeholder="Search..." startAdornment={searchIcon} />
        <Input placeholder="Clearable" defaultValue="Hello" onClear={() => {}} />
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <Input aria-label="Focused" defaultValue="Hello world" />,
    );
    const input = getByRole("textbox");
    focusVisible(input);
    await expect(fixture).toMatchScreenshot();
  });

  // The wrapper that positions the adornments sets no overflow, so the input's ring shows in full
  it("with adornments focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <div style={{ width: 300 }}>
        <Input
          aria-label="Focused"
          startAdornment={searchIcon}
          defaultValue="Hello"
          onClear={() => {}}
        />
      </div>,
    );
    const input = getByRole("textbox");
    focusVisible(input);
    await expect(fixture).toMatchScreenshot();
  });

  it("shows a not-allowed cursor on an Input in a disabled Field.Root", () => {
    const { getByRole } = render(
      <Field.Root disabled>
        <Input aria-label="Name" />
      </Field.Root>,
    );
    expectNotAllowed(getByRole("textbox", { name: "Name" }));
  });

  // A disabled Field.Root disables the input through Base UI, not through the `disabled` prop,
  // so the button hides by CSS, off the input's disabled attribute
  it("hides the clear button inside a disabled Field.Root", () => {
    const { getByRole } = render(
      <Field.Root disabled>
        <Input aria-label="Name" clearable defaultValue="x" />
      </Field.Root>,
    );
    // `hidden: true` finds the button also when display: none takes it out of the a11y tree
    expect(getByRole("button", { name: /clear/i, hidden: true })).not.toBeVisible();
  });

  it("shows the clear button inside an enabled Field.Root", () => {
    const { getByRole } = render(
      <Field.Root>
        <Input aria-label="Name" clearable defaultValue="x" />
      </Field.Root>,
    );
    expect(getByRole("button", { name: /clear/i })).toBeVisible();
  });

  // The button and the endAdornment share one slot. Inside a disabled Field.Root the button
  // hides by CSS, so the adornment has to show in its place, as it does for the `disabled` prop
  it("shows the endAdornment in place of the hidden clear button inside a disabled Field.Root", () => {
    const { getByRole, getByText } = render(
      <Field.Root disabled>
        <Input aria-label="Amount" clearable endAdornment="USD" defaultValue="x" />
      </Field.Root>,
    );
    expect(getByRole("button", { name: /clear/i, hidden: true })).not.toBeVisible();
    expect(getByText("USD")).toBeVisible();
  });

  it("shows the clear button in place of the endAdornment", () => {
    const { getByRole, getByText } = render(
      <Input aria-label="Amount" clearable endAdornment="USD" defaultValue="x" />,
    );
    expect(getByRole("button", { name: /clear/i })).toBeVisible();
    expect(getByText("USD")).not.toBeVisible();
  });

  it("shows the clear button in place of the endAdornment inside an enabled Field.Root", () => {
    const { getByRole, getByText } = render(
      <Field.Root>
        <Input aria-label="Amount" clearable endAdornment="USD" defaultValue="x" />
      </Field.Root>,
    );
    expect(getByRole("button", { name: /clear/i })).toBeVisible();
    expect(getByText("USD")).not.toBeVisible();
  });
});
