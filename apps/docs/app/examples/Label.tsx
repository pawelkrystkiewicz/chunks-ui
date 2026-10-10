"use client";

import { Checkbox, Label } from "chunks-ui";
import { Container } from "@/components";

export function LabelDisabledControlExample() {
  return (
    <Container>
      <div className="flex items-center gap-2">
        <Label htmlFor="terms">Accept terms</Label>
        <Checkbox.Root id="terms" disabled>
          <Checkbox.Indicator />
        </Checkbox.Root>
      </div>
    </Container>
  );
}
