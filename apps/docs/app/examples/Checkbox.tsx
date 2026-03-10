"use client";

import { Checkbox, Field } from "chunks-ui";
import { Container } from "@/components";

export function CheckboxBasicExample() {
  return (
    <Container>
      <Checkbox.Root>
        <Checkbox.Indicator />
      </Checkbox.Root>
    </Container>
  );
}

export function CheckboxWithLabelExample() {
  return (
    <Container>
      <Field.Root>
        <div className="flex items-center gap-2">
          <Checkbox.Root>
            <Checkbox.Indicator />
          </Checkbox.Root>
          <Field.Label>Accept terms and conditions</Field.Label>
        </div>
      </Field.Root>
    </Container>
  );
}

export function CheckboxIndeterminateExample() {
  return (
    <Container>
      <Checkbox.Root indeterminate>
        <Checkbox.Indicator />
      </Checkbox.Root>
    </Container>
  );
}

export function CheckboxDisabledExample() {
  return (
    <Container className="rounded-lg bg-card p-8">
      <Checkbox.Root disabled>
        <Checkbox.Indicator />
      </Checkbox.Root>
      <Checkbox.Root disabled checked>
        <Checkbox.Indicator />
      </Checkbox.Root>
    </Container>
  );
}
