import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderFixture } from "../../VisualTest.utils";
import { Combobox } from "../combobox";
import { Input } from "../input";
import { Select } from "../select";
import { Textarea } from "../textarea";
import { Field } from "./index";

/** How far, in CSS px, `control`'s focus ring stays from the Label above it and the text below it */
function ringClearance(control: HTMLElement, label: Element, below: Element) {
  const style = getComputedStyle(control);
  const reach = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
  const box = control.getBoundingClientRect();
  return {
    reach,
    aboveLabel: box.top - reach - label.getBoundingClientRect().bottom,
    belowText: below.getBoundingClientRect().top - (box.bottom + reach),
  };
}

const inField = (control: ReactNode) => (
  <div style={{ width: 300 }}>
    <Field.Root>
      <Field.Label>Email</Field.Label>
      {control}
      <Field.Description>We'll never share your email.</Field.Description>
    </Field.Root>
  </div>
);

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

  // The ring reaches 4px past the control (2px offset, 2px wide). The Label and the Description
  // sit at the default gap-2 (8px), so the ring stays 4px clear of their line boxes. At gap-1 it
  // met them, and descenders under the Label's `leading-none` reached about 1px into the ring.
  it("focused Input, ring clear of the Label and Description", async () => {
    const { fixture, getByRole, getByText } = await renderFixture(
      inField(<Field.Control render={<Input placeholder="you@example.com" />} />),
    );
    const input = getByRole("textbox");
    input.focus();
    expect(input.matches(":focus-visible")).toBe(true);
    const clearance = ringClearance(input, getByText("Email"), getByText(/never share/));
    expect(clearance.reach).toBe(4);
    expect(clearance.aboveLabel).toBeGreaterThanOrEqual(4);
    expect(clearance.belowText).toBeGreaterThanOrEqual(4);
    await expect(fixture).toMatchScreenshot();
  });

  it.each([
    { control: "Textarea", ui: <Textarea />, role: "textbox" },
    {
      control: "Select.Trigger",
      ui: (
        <Select.Root>
          <Select.Trigger>
            <Select.Value placeholder="Pick one" />
            <Select.Icon />
          </Select.Trigger>
        </Select.Root>
      ),
      role: "combobox",
    },
    {
      control: "Combobox.Input",
      ui: (
        <Combobox.Root items={["Apple"]}>
          <Combobox.Input />
        </Combobox.Root>
      ),
      role: "combobox",
    },
  ])(
    "keeps the ring of a focused $control clear of the Label and Description",
    async ({ ui, role }) => {
      const { getByRole, getByText } = await renderFixture(inField(ui));
      const control = getByRole(role);
      control.focus();
      expect(control.matches(":focus-visible")).toBe(true);
      const clearance = ringClearance(control, getByText("Email"), getByText(/never share/));
      expect(clearance.reach).toBe(4);
      expect(clearance.aboveLabel).toBeGreaterThanOrEqual(4);
      expect(clearance.belowText).toBeGreaterThanOrEqual(4);
    },
  );
});
