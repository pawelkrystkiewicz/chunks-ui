"use client";

import { Accordion } from "chunks-ui";
import { Container } from "@/components";

export function AccordionBasicExample() {
  return (
    <Container>
      <Accordion.Root className="w-full max-w-md">
        <Accordion.Item value="item-1">
          <Accordion.Header>
            <Accordion.Trigger>What is chunks-ui?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">
              A personal React component library built on Base UI primitives with Tailwind CSS
              styling.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Header>
            <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">
              Yes. Keyboard navigation and ARIA attributes are handled by Base UI's Accordion
              primitive.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Header>
            <Accordion.Trigger>Can I style it?</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">
              Pass a className to any part. All parts forward className and spread remaining props.
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </Container>
  );
}

export function AccordionMultipleExample() {
  return (
    <Container>
      <Accordion.Root className="w-full max-w-md" multiple>
        <Accordion.Item value="item-1">
          <Accordion.Header>
            <Accordion.Trigger>Section One</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">Content for section one. Multiple items can be open at once.</div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Header>
            <Accordion.Trigger>Section Two</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">Content for section two. Open both at the same time.</div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Header>
            <Accordion.Trigger>Section Three</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">Content for section three.</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </Container>
  );
}

export function AccordionDefaultOpenExample() {
  return (
    <Container>
      <Accordion.Root className="w-full max-w-md" defaultValue={["item-1"]}>
        <Accordion.Item value="item-1">
          <Accordion.Header>
            <Accordion.Trigger>Open by default</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">This item is open on first render via defaultValue.</div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Header>
            <Accordion.Trigger>Closed by default</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">This item starts closed.</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </Container>
  );
}

export function AccordionDisabledExample() {
  return (
    <Container>
      <Accordion.Root className="w-full max-w-md">
        <Accordion.Item value="item-1">
          <Accordion.Header>
            <Accordion.Trigger>Available item</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">This item can be opened.</div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="item-2" disabled>
          <Accordion.Header>
            <Accordion.Trigger>Disabled item</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>
            <div className="pb-4">This content is unreachable when disabled.</div>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </Container>
  );
}
