"use client";

import { Radio } from "chunks-ui";
import { Container } from "@/components";

export function RadioBasicExample() {
  return (
    <Container>
      <Radio.Group defaultValue="option-a">
        <Radio.Item value="option-a">Option A</Radio.Item>
        <Radio.Item value="option-b">Option B</Radio.Item>
        <Radio.Item value="option-c">Option C</Radio.Item>
      </Radio.Group>
    </Container>
  );
}

export function RadioDisabledExample() {
  return (
    <Container>
      <Radio.Group disabled>
        <Radio.Item value="a">Disabled option</Radio.Item>
      </Radio.Group>
    </Container>
  );
}
