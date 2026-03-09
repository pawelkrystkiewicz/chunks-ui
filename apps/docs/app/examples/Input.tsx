"use client";

import { Field, Input } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function InputErrorExample() {
  return (
    <Container>
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Input placeholder="user@example.com" />
        <Field.Error>Invalid email address</Field.Error>
      </Field.Root>
    </Container>
  );
}

export function InputWithFieldExample() {
  return (
    <Container>
      <Field.Root>
        <Field.Label>Username</Field.Label>
        <Field.Description>Choose a unique username</Field.Description>
        <Input placeholder="johndoe" />
      </Field.Root>
    </Container>
  );
}

export const InputWithClearButton = () => {
  const [value, setValue] = useState("");

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClear={() => setValue("")}
      placeholder="Search..."
    />
  );
};
