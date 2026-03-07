"use client";

import { Radio } from "chunks-ui";
import { Container } from "@/components";

export function RadioBasicExample() {
  return (
    <Container>
      <Radio.Group defaultValue="option-a">
        <div className="flex items-center gap-2">
          <Radio.Root value="option-a">
            <Radio.Indicator />
          </Radio.Root>
          <span>Option A</span>
        </div>
        <div className="flex items-center gap-2">
          <Radio.Root value="option-b">
            <Radio.Indicator />
          </Radio.Root>
          <span>Option B</span>
        </div>
        <div className="flex items-center gap-2">
          <Radio.Root value="option-c">
            <Radio.Indicator />
          </Radio.Root>
          <span>Option C</span>
        </div>
      </Radio.Group>
    </Container>
  );
}

export function RadioDisabledExample() {
  return (
    <Container>
      <Radio.Group disabled>
        <div className="flex items-center gap-2">
          <Radio.Root value="a">
            <Radio.Indicator />
          </Radio.Root>
          <span>Disabled option</span>
        </div>
      </Radio.Group>
    </Container>
  );
}
