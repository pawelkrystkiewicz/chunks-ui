"use client";

import { Popover } from "chunks-ui";
import { Container } from "@/components";

export function PopoverBasicExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>More info</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Details</Popover.Title>
          <Popover.Description>This is additional context about the feature.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    </Container>
  );
}

export function PopoverArrowExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>Help</Popover.Trigger>
        <Popover.Content>
          <Popover.Arrow />
          <Popover.Title>Need help?</Popover.Title>
          <Popover.Description>Contact support at help@example.com.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    </Container>
  );
}

export function PopoverCloseExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <div className="flex items-center justify-between">
            <Popover.Title>Settings</Popover.Title>
            <Popover.Close>Close</Popover.Close>
          </div>
          <Popover.Description>Configure your preferences here.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    </Container>
  );
}
