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
});
