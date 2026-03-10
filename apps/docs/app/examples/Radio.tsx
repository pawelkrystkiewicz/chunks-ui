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
    <Container className="rounded-lg bg-card p-8">
      <Radio.Group disabled defaultValue="b">
        <Radio.Item value="a">Unselected</Radio.Item>
        <Radio.Item value="b">Selected</Radio.Item>
      </Radio.Group>
    </Container>
  );
}
