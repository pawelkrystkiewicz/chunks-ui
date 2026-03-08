"use client";

import { ToggleGroup } from "chunks-ui";
import { Container } from "@/components";

export function ToggleGroupBasicExample() {
  return (
    <Container>
      <ToggleGroup.Root defaultValue={["bold"]}>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}

export function ToggleGroupMultipleExample() {
  return (
    <Container>
      <ToggleGroup.Root multiple defaultValue={["bold", "italic"]}>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}
