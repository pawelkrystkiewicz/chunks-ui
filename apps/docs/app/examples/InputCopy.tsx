"use client";

import { InputCopy } from "chunks-ui";
import { useState } from "react";
import { Container } from "@/components";

export function InputCopyBasicExample() {
  return (
    <Container>
      <InputCopy value="https://vibekanban.com/invite/abc123" aria-label="Invite link" />
    </Container>
  );
}

export function InputCopyEditableExample() {
  const [value, setValue] = useState("PROMO-2024-SUMMER");

  return (
    <Container>
      <InputCopy
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={false}
        aria-label="Promo code"
      />
    </Container>
  );
}
