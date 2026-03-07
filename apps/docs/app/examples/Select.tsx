"use client";

import { Select } from "chunks-ui";
import { Container } from "@/components";

export function SelectBasicExample() {
  return (
    <Container>
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Choose a fruit" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="apple">
                <Select.ItemText>Apple</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
              <Select.Item value="banana">
                <Select.ItemText>Banana</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
              <Select.Item value="cherry">
                <Select.ItemText>Cherry</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Container>
  );
}

export function SelectGroupedExample() {
  return (
    <Container>
      <Select.Root>
        <Select.Trigger>
          <Select.Value placeholder="Pick a color" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Group>
                <Select.GroupLabel>Warm</Select.GroupLabel>
                <Select.Item value="red">
                  <Select.ItemText>Red</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="orange">
                  <Select.ItemText>Orange</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.Group>
              <Select.Group>
                <Select.GroupLabel>Cool</Select.GroupLabel>
                <Select.Item value="blue">
                  <Select.ItemText>Blue</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
                <Select.Item value="green">
                  <Select.ItemText>Green</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              </Select.Group>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Container>
  );
}
