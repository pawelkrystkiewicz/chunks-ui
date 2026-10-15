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

  // Keyboard focus shows the ring: 2px of --ring, 2px outside the edge
  it("focus-visible", async () => {
    const { fixture, getByRole } = await renderFixture(
      <Textarea aria-label="Focused" placeholder="Enter text..." style={{ width: 300 }} />,
    );
    const textarea = getByRole("textbox");
    textarea.focus();
    expect(textarea.matches(":focus-visible")).toBe(true);
    await expect(fixture).toMatchScreenshot();
  });
});
