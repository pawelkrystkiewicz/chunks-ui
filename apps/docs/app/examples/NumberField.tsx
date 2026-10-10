"use client";

import { Field, NumberField } from "chunks-ui";
import { Container } from "@/components";

export function NumberFieldBasicExample() {
  return (
    <Container>
      <NumberField.Root defaultValue={10}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    </Container>
  );
}

export function NumberFieldMinMaxExample() {
  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Field.Root>
          <Field.Label className="font-normal text-muted-foreground">Quantity (1–20)</Field.Label>
          <NumberField.Root defaultValue={5} min={1} max={20}>
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label className="font-normal text-muted-foreground">Step by 5</Field.Label>
          <NumberField.Root defaultValue={0} min={0} max={100} step={5}>
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </Field.Root>
      </div>
    </Container>
  );
}

export function NumberFieldScrubExample() {
  return (
    <Container>
      <div className="flex flex-col gap-1">
        <NumberField.Root defaultValue={100}>
          <NumberField.ScrubArea>
            <span className="text-muted-foreground text-sm">Drag to adjust</span>
            <NumberField.ScrubAreaCursor />
          </NumberField.ScrubArea>
          <NumberField.Group>
            <NumberField.Decrement />
            <NumberField.Input aria-label="Amount" />
            <NumberField.Increment />
          </NumberField.Group>
        </NumberField.Root>
      </div>
    </Container>
  );
}

export function NumberFieldDisabledExample() {
  return (
    <Container>
      <NumberField.Root defaultValue={42} disabled>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    </Container>
  );
}
