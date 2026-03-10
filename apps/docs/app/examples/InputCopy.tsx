"use client";

import { InputCopy } from "chunks-ui";
import { Container } from "@/components";

export function InputCopyBasicExample() {
  return (
    <Container>
      <InputCopy value="https://vibekanban.com/invite/abc123" />
    </Container>
  );
}

export function InputCopyEditableExample() {
  return (
    <Container centered={false}>
      <InputCopy value="PROMO-2024-SUMMER" readOnly={false} />
    </Container>
  );
}
