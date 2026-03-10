"use client";

import { Field, Switch } from "chunks-ui";
import { Container } from "@/components";

export function SwitchBasicExample() {
  return (
    <Container>
      <Switch.Root>
        <Switch.Thumb />
      </Switch.Root>
    </Container>
  );
}

export function SwitchWithLabelExample() {
  return (
    <Container>
      <Field.Root>
        <div className="flex items-center gap-2">
          <Switch.Root>
            <Switch.Thumb />
          </Switch.Root>
          <Field.Label>Enable notifications</Field.Label>
        </div>
      </Field.Root>
    </Container>
  );
}

export function SwitchDisabledExample() {
  return (
    <Container className="rounded-lg bg-card p-8">
      <Switch.Root disabled>
        <Switch.Thumb />
      </Switch.Root>
      <Switch.Root disabled checked>
        <Switch.Thumb />
      </Switch.Root>
    </Container>
  );
}
