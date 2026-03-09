"use client";

import { NumberField } from "chunks-ui";
import { Container } from "@/components";

export function NumberFieldBasicExample() {
  return (
    <Container>
      <NumberField.Root defaultValue={10}>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input />
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
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">Quantity (1–20)</span>
          <NumberField.Root defaultValue={5} min={1} max={20}>
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">Step by 5</span>
          <NumberField.Root defaultValue={0} min={0} max={100} step={5}>
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
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
            <NumberField.Input />
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
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    </Container>
  );
}
