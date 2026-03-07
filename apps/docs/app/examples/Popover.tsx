"use client";

import { Popover } from "chunks-ui";
import { Container } from "@/components";

export function PopoverBasicExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>More info</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Title>Details</Popover.Title>
              <Popover.Description>
                This is additional context about the feature.
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Container>
  );
}

export function PopoverArrowExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>Help</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Arrow />
              <Popover.Title>Need help?</Popover.Title>
              <Popover.Description>Contact support at help@example.com.</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Container>
  );
}

export function PopoverCloseExample() {
  return (
    <Container>
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <div className="flex items-center justify-between">
                <Popover.Title>Settings</Popover.Title>
                <Popover.Close>Close</Popover.Close>
              </div>
              <Popover.Description>Configure your preferences here.</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </Container>
  );
}
