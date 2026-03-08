import { describe, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Input } from "../input";
import { Field } from "./index";

describe("Field", () => {
  it("default", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 300 }}>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Control render={<Input placeholder="you@example.com" />} />
          <Field.Description>We'll never share your email.</Field.Description>
        </Field.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("with error", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 300 }}>
        <Field.Root invalid>
          <Field.Label>Email</Field.Label>
          <Field.Control render={<Input placeholder="you@example.com" />} />
          <Field.Error>This field is required.</Field.Error>
        </Field.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });

  it("disabled", async () => {
    const { fixture } = await renderFixture(
      <div style={{ width: 300 }}>
        <Field.Root disabled>
          <Field.Label>Email</Field.Label>
          <Field.Control render={<Input placeholder="you@example.com" />} />
        </Field.Root>
      </div>,
    );
    await expect(fixture).toMatchScreenshot();
  });
});
