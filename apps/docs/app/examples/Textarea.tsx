"use client";

import { Field, Textarea } from "chunks-ui";
import { Container } from "@/components";

export function TextareaWithFieldExample() {
  return (
    <Container centered={false}>
      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <Field.Description>Write a short bio (max 280 characters)</Field.Description>
        <Textarea autoResize placeholder="Tell us about yourself..." maxLength={280} />
      </Field.Root>
    </Container>
  );
}
