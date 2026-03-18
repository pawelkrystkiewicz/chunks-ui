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
import { Container } from "@/components";

export function ToggleGroupBasicExample() {
  return (
    <Container>
      <ToggleGroup.Root defaultValue={["left"]}>
        <ToggleGroup.Item value="left">
          <AlignLeftIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="center">
          <AlignCenterIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="right">
          <AlignRightIcon />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}

export function ToggleGroupMultipleExample() {
  return (
    <Container>
      <ToggleGroup.Root multiple defaultValue={["bold", "italic"]}>
        <ToggleGroup.Item value="bold">
          <BoldIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="italic">
          <ItalicIcon />
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline">
          <UnderlineIcon />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </Container>
  );
}
