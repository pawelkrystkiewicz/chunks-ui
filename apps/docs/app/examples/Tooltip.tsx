"use client";

import { Tooltip } from "chunks-ui";
import { Container } from "@/components";

export function TooltipBasicExample() {
  return (
    <Container>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button type="button">Hover me</button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Helpful tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Container>
  );
}

export function TooltipArrowExample() {
  return (
    <Container>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button type="button">Info</button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Arrow />
              This is a tooltip with an arrow.
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Container>
  );
}

export function TooltipProviderExample() {
  return (
    <Container>
      <Tooltip.Provider delay={200} closeDelay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <button type="button">A</button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Tooltip A</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger>
            <button type="button">B</button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Tooltip B</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </Container>
  );
}
