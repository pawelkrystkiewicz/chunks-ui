import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { focusVisible, renderFixture } from "../../VisualTest.utils";
import { Field } from "../field";
import { Textarea } from "../textarea";
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

  it("shows a not-allowed cursor on an Input and a Textarea in one disabled Field.Root", () => {
    const { getByRole } = render(
      <Field.Root disabled>
        <Input aria-label="Name" />
        <Textarea aria-label="Bio" />
      </Field.Root>,
    );
    const looks = (name: string) => {
      const { cursor, pointerEvents } = getComputedStyle(getByRole("textbox", { name }));
      return { cursor, pointerEvents };
    };
    expect(looks("Name")).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
    expect(looks("Bio")).toEqual({ cursor: "not-allowed", pointerEvents: "auto" });
  });
});
