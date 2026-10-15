import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

// Inside a disabled Field.Root, Base UI sets data-disabled on Field.Label, and the label's look
// keys on that attribute alone, so one `data-disabled:` class in className restyles it
describe("Field.Label when disabled", () => {
  const looks = (el: Element) => {
    const { opacity, cursor } = getComputedStyle(el);
    return { opacity, cursor };
  };

  it.each<[string, string | undefined, string]>([
    ["dims and shows a not-allowed cursor", undefined, "0.5"],
    ["takes a `data-disabled:` class over its own opacity", "data-disabled:opacity-75", "0.75"],
  ])("%s", (_, className, opacity) => {
    const { getByText } = render(
      <Field.Root disabled>
        <Field.Label className={className}>Email</Field.Label>
        <Field.Control render={<Input />} />
      </Field.Root>,
    );
    expect(looks(getByText("Email"))).toEqual({ opacity, cursor: "not-allowed" });
  });

  it("leaves the label of an enabled field alone", () => {
    const { getByText } = render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control render={<Input />} />
      </Field.Root>,
    );
    expect(looks(getByText("Email"))).toEqual({ opacity: "1", cursor: "default" });
  });
});
