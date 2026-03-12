"use client";

import { Accordion } from "chunks-ui";
import { FAQ_ITEMS } from "./data";

export function FaqSection() {
  return (
    <Accordion.Root className="w-full">
      {FAQ_ITEMS.map((item) => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Header>
            <Accordion.Trigger>{item.question}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4 text-muted-foreground text-sm leading-relaxed">{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
