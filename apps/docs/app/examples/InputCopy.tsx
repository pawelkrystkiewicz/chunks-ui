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
