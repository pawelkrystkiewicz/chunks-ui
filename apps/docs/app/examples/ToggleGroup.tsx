"use client";

import { ToggleGroup } from "chunks-ui";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
} from "lucide-react";
import { useState } from "react";
import { Container } from "@/components";

export function ToggleGroupBasicExample() {
  return (
    <Container>
      <ToggleGroup.Root aria-label="Text alignment" defaultValue={["left"]}>
        <ToggleGroup.Item value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}

export function ToggleGroupMultipleExample() {
  return (
    <Container>
      <ToggleGroup.Root aria-label="Text formatting" multiple defaultValue={["bold", "italic"]}>
        <ToggleGroup.Item value="bold" aria-label="Bold">
          <BoldIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic" aria-label="Italic">
          <ItalicIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline" aria-label="Underline">
          <UnderlineIcon />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}

export function ToggleGroupRequiredExample() {
  const [value, setValue] = useState(["left"]);

  return (
    <Container>
      <ToggleGroup.Root
        aria-label="Text alignment"
        value={value}
        onValueChange={(newValue) => {
          // Reject empty selection — keep previous value
          if (newValue.length > 0) setValue(newValue);
        }}
      >
        <ToggleGroup.Item value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}
