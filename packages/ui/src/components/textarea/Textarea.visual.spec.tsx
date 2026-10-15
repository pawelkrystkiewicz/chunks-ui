import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Field } from "../field";
import { Input } from "../input";
import { Textarea } from "./index";

describe("Textarea", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <Textarea placeholder="Enter text..." style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with value", async () => {
    const { fixture } = await renderFixture(
      <Textarea defaultValue={"Hello world\nSecond line"} style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <Textarea placeholder="Disabled" disabled style={{ width: 300 }} />,
    );
    await expect(fixture).toMatchScreenshot();
  });

  // pointer-events: none would hide the not-allowed cursor; a disabled textarea takes no input.
  // It would also have kept the resize grip from dragging: Chromium resizes a disabled textarea.
  it("shows a not-allowed cursor and no resize grip on a disabled textarea", () => {
    const { getByRole } = render(
      <div>
        <Textarea aria-label="Enabled" />
        <Textarea aria-label="Disabled" disabled />
      </div>,
    );
    const { cursor, pointerEvents, resize } = getComputedStyle(
      getByRole("textbox", { name: "Disabled" }),
    );
    expect({ cursor, pointerEvents, resize }).toEqual({
      cursor: "not-allowed",
      pointerEvents: "auto",
      resize: "none",
    });
    const enabled = getComputedStyle(getByRole("textbox", { name: "Enabled" }));
    expect(enabled.cursor).not.toBe("not-allowed");
    expect(enabled.resize).not.toBe("none");
  });

  it("in an invalid Field, has the same border colour as an invalid Input", async () => {
    const { getByRole } = await renderFixture(
      <div>
        <Field.Root>
          <Field.Label>Notes</Field.Label>
          <Textarea />
        </Field.Root>
        <Field.Root invalid>
          <Field.Label>Bio</Field.Label>
          <Textarea />
        </Field.Root>
        <Field.Root invalid>
          <Field.Label>Email</Field.Label>
          <Input />
        </Field.Root>
      </div>,
    );
    const borderOf = (name: string) => getComputedStyle(getByRole("textbox", { name })).borderColor;
    expect(borderOf("Bio")).toBe(borderOf("Email"));
    expect(borderOf("Bio")).not.toBe(borderOf("Notes"));
  });
});
