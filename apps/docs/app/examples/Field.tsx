"use client";

import { Field, Input, Textarea } from "chunks-ui";
import { Container } from "@/components";

export function FieldBasicExample() {
  return (
    <Container>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input type="email" placeholder="you@example.com" />
      </Field.Root>
    </Container>
  );
}

export function FieldDescriptionExample() {
  return (
    <Container>
      <Field.Root>
        <Field.Label>Password</Field.Label>
        <Field.Description>Must be at least 8 characters.</Field.Description>
        <Input type="password" />
      </Field.Root>
    </Container>
  );
}

export function FieldErrorExample() {
  return (
    <Container>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Input type="email" placeholder="you@example.com" />
        <Field.Error>Please enter a valid email address.</Field.Error>
      </Field.Root>
    </Container>
  );
}

export function FieldTextareaExample() {
  return (
    <Container>
      <Field.Root>
        <Field.Label>Message</Field.Label>
        <Field.Description>Describe your issue in detail.</Field.Description>
        <Textarea autoResize placeholder="Type here..." />
      </Field.Root>
    </Container>
  );
}

export function FieldDisabledExample() {
  return (
    <Container>
      <Field.Root disabled>
        <Field.Label>Locked Field</Field.Label>
        <Input disabled value="Cannot edit" />
      </Field.Root>
    </Container>
  );
}
