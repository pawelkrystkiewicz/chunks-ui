"use client";

import { Button, Tooltip } from "chunks-ui";
import { Container } from "@/components";

export function TooltipBasicExample() {
  return (
    <Container>
      <Tooltip.Root>
        <Tooltip.Trigger render={<Button variant="outlined" />}>Hover me</Tooltip.Trigger>
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
        <Tooltip.Trigger render={<Button variant="outlined" />}>Info</Tooltip.Trigger>
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

export function TooltipPositioningExample() {
  return (
    <Container>
      <Tooltip.Provider delay={0}>
        <div className="grid grid-cols-2 gap-4">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Tooltip.Root key={side}>
              <Tooltip.Trigger render={<Button variant="outlined" />}>
                {side.charAt(0).toUpperCase() + side.slice(1)}
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner side={side}>
                  <Tooltip.Popup>
                    <Tooltip.Arrow />
                    {side} tooltip
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </div>
      </Tooltip.Provider>
    </Container>
  );
}

export function TooltipProviderExample() {
  return (
    <Container>
      <Tooltip.Provider delay={200} closeDelay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="outlined" />}>A</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Tooltip A</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="outlined" />}>B</Tooltip.Trigger>
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
